using CairoBags.Helpers;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace CairoBags.Service;

/// <summary>
/// Normalizes admin product uploads into transparent square cutouts (PNG/WebP),
/// matching the Home Categories visual style — product only, no white rectangle.
/// </summary>
public sealed class ProductImageProcessingService : IProductImageProcessingService
{
    private const int MaxInputDimension = 2500;
    private const float ProductFillRatio = 0.90f;

    private const byte AlphaBackgroundThreshold = 20;
    private const int EdgeFeatherRadius = 2;
    private const int WebpQuality = 92;

    // Edge-connected background flood tolerances (studio white + soft floor shadows).
    private const byte SeedMinChannel = 238;
    private const byte SeedMaxChroma = 20;
    private const byte ExpandMinLuma = 178;
    private const byte ExpandMaxChroma = 28;
    private const byte SoftShadowMinChannel = 175;
    private const int SoftShadowMaxColorDelta = 42;

    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ProductImageProcessingService> _logger;

    public ProductImageProcessingService(
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<ProductImageProcessingService> logger)
    {
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    public Task<ProductImageProcessingResult> TryNormalizeByUrlAsync(
        string? imageUrl,
        CancellationToken cancellationToken = default)
    {
        if (!TryResolvePhysicalPath(imageUrl, out var absolutePath))
            return Task.FromResult(ProductImageProcessingResult.Failed());

        return TryNormalizeAsync(absolutePath, cancellationToken);
    }

    public async Task<ProductImageProcessingResult> TryNormalizeAsync(
        string absoluteFilePath,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(absoluteFilePath) || !File.Exists(absoluteFilePath))
            return ProductImageProcessingResult.Failed();

        var inputExtension = Path.GetExtension(absoluteFilePath);
        if (!IsSupportedExtension(inputExtension))
            return ProductImageProcessingResult.Failed();

        var tempPaths = new List<string>();

        try
        {
            using var image = await LoadImageAsync(absoluteFilePath, cancellationToken);

            if (image.Width == 0 || image.Height == 0)
                return ProductImageProcessingResult.Failed();

            DownscaleIfNeeded(image);

            // True cutout extraction (edge flood + despill) — not simple RGB strip.
            ExtractForegroundCutout(image);

            var bounds = DetectContentBounds(image);
            if (bounds.Width <= 0 || bounds.Height <= 0)
                return ProductImageProcessingResult.Failed();

            using var cropped = image.Clone(ctx => ctx.Crop(bounds));

            var outputExtension = GetTransparentOutputExtension(inputExtension);
            var transparent = new Rgba32(0, 0, 0, 0);

            var canvasSize = ProductImageUrlHelper.OriginalSize;
            var targetMax = (int)Math.Round(canvasSize * ProductFillRatio);
            var scale = Math.Min(
                targetMax / (float)cropped.Width,
                targetMax / (float)cropped.Height);

            var scaledWidth = Math.Max(1, (int)Math.Round(cropped.Width * scale));
            var scaledHeight = Math.Max(1, (int)Math.Round(cropped.Height * scale));

            using var scaled = cropped.Clone(ctx => ctx.Resize(scaledWidth, scaledHeight, KnownResamplers.Lanczos3));
            using var canvas = new Image<Rgba32>(canvasSize, canvasSize, transparent);

            var offsetX = (canvasSize - scaledWidth) / 2;
            var offsetY = (canvasSize - scaledHeight) / 2;
            canvas.Mutate(ctx => ctx.DrawImage(scaled, new Point(offsetX, offsetY), 1f));

            // Lanczos can reintroduce faint white fringe — clean once more on final canvas.
            DespillEdgeHalo(canvas);
            ZeroRgbOnTransparent(canvas);

            var outputBasePath = Path.Combine(
                Path.GetDirectoryName(absoluteFilePath)!,
                Path.GetFileNameWithoutExtension(absoluteFilePath));

            var originalOutputPath = outputBasePath + outputExtension;
            var mediumOutputPath = ProductImageUrlHelper.GetMediumThumbnailUrl(originalOutputPath);
            var smallOutputPath = ProductImageUrlHelper.GetSmallThumbnailUrl(originalOutputPath);

            await SaveWithTempAsync(canvas, originalOutputPath, tempPaths, cancellationToken);
            await SaveResizedWithTempAsync(
                canvas,
                mediumOutputPath,
                ProductImageUrlHelper.MediumSize,
                tempPaths,
                cancellationToken);
            await SaveResizedWithTempAsync(
                canvas,
                smallOutputPath,
                ProductImageUrlHelper.SmallSize,
                tempPaths,
                cancellationToken);

            if (!string.Equals(absoluteFilePath, originalOutputPath, StringComparison.OrdinalIgnoreCase)
                && File.Exists(absoluteFilePath))
            {
                File.Delete(absoluteFilePath);
            }

            CleanupStaleDerivatives(absoluteFilePath, originalOutputPath);

            return ProductImageProcessingResult.Ok(originalOutputPath, mediumOutputPath, smallOutputPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to normalize product image at {FilePath}", absoluteFilePath);
            CleanupTempFiles(tempPaths);
            return ProductImageProcessingResult.Failed();
        }
    }

    private static async Task<Image<Rgba32>> LoadImageAsync(string absoluteFilePath, CancellationToken cancellationToken)
    {
        await using var inputStream = File.OpenRead(absoluteFilePath);
        return await Image.LoadAsync<Rgba32>(inputStream, cancellationToken);
    }

    private bool TryResolvePhysicalPath(string? imageUrl, out string absolutePath)
    {
        absolutePath = string.Empty;
        if (string.IsNullOrWhiteSpace(imageUrl))
            return false;

        var storageFolder = _configuration["FileStorage:Path"] ?? "FileStorage";
        var prefix = $"/{storageFolder}/";
        if (!imageUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        var relative = imageUrl[prefix.Length..].Replace('/', Path.DirectorySeparatorChar);
        var rootPath = _environment.ContentRootPath ?? Directory.GetCurrentDirectory();
        absolutePath = Path.GetFullPath(Path.Combine(rootPath, storageFolder, relative));

        var storageRoot = Path.GetFullPath(Path.Combine(rootPath, storageFolder));
        if (!absolutePath.StartsWith(storageRoot, StringComparison.OrdinalIgnoreCase))
            return false;

        return File.Exists(absolutePath);
    }

    private static bool IsSupportedExtension(string? extension) =>
        extension?.ToLowerInvariant() is ".jpg" or ".jpeg" or ".png" or ".webp";

    private static string GetTransparentOutputExtension(string inputExtension) =>
        inputExtension.ToLowerInvariant() == ".webp" ? ".webp" : ".png";

    private static void DownscaleIfNeeded(Image<Rgba32> image)
    {
        var longestEdge = Math.Max(image.Width, image.Height);
        if (longestEdge <= MaxInputDimension)
            return;

        image.Mutate(ctx => ctx.Resize(new ResizeOptions
        {
            Size = new Size(MaxInputDimension, MaxInputDimension),
            Mode = ResizeMode.Max,
            Sampler = KnownResamplers.Lanczos3
        }));
    }

    /// <summary>
    /// Edge-connected studio background removal with soft floor shadows, then despill fringes.
    /// Preserves non-edge-connected light pixels (e.g. logos on the bag).
    /// </summary>
    private static void ExtractForegroundCutout(Image<Rgba32> image)
    {
        var bgSample = SampleBorderBackground(image);
        FloodClearEdgeBackground(image, bgSample);
        ApplySoftMatteNearBackground(image, bgSample);
        DespillEdgeHalo(image);
        FeatherTransparentEdges(image, EdgeFeatherRadius);
        DespillEdgeHalo(image);
        ZeroRgbOnTransparent(image);
    }

    private static Rgba32 SampleBorderBackground(Image<Rgba32> image)
    {
        long sumR = 0, sumG = 0, sumB = 0;
        var count = 0;
        var w = image.Width;
        var h = image.Height;
        var step = Math.Max(1, Math.Min(w, h) / 64);

        void Acc(int x, int y)
        {
            var p = image[x, y];
            if (p.A < AlphaBackgroundThreshold)
                return;
            if (!LooksLikeStudioBackground(p, seed: true, bg: default, useBg: false))
                return;
            sumR += p.R;
            sumG += p.G;
            sumB += p.B;
            count++;
        }

        for (var x = 0; x < w; x += step)
        {
            Acc(x, 0);
            Acc(x, h - 1);
        }

        for (var y = 0; y < h; y += step)
        {
            Acc(0, y);
            Acc(w - 1, y);
        }

        // Corners always
        Acc(0, 0);
        Acc(w - 1, 0);
        Acc(0, h - 1);
        Acc(w - 1, h - 1);

        if (count == 0)
            return new Rgba32(255, 255, 255, 255);

        return new Rgba32(
            (byte)(sumR / count),
            (byte)(sumG / count),
            (byte)(sumB / count),
            255);
    }

    private static void FloodClearEdgeBackground(Image<Rgba32> image, Rgba32 bgSample)
    {
        var width = image.Width;
        var height = image.Height;
        var visited = new bool[width * height];
        var queue = new Queue<(int X, int Y)>();

        void TryEnqueue(int x, int y, bool seed)
        {
            if (x < 0 || y < 0 || x >= width || y >= height)
                return;

            var index = (y * width) + x;
            if (visited[index])
                return;

            var pixel = image[x, y];
            if (pixel.A <= AlphaBackgroundThreshold)
            {
                visited[index] = true;
                image[x, y] = default;
                queue.Enqueue((x, y));
                return;
            }

            if (!LooksLikeStudioBackground(pixel, seed, bgSample, useBg: true))
                return;

            visited[index] = true;
            queue.Enqueue((x, y));
        }

        // Seeds: entire border that looks like background.
        for (var x = 0; x < width; x++)
        {
            TryEnqueue(x, 0, seed: true);
            TryEnqueue(x, height - 1, seed: true);
        }

        for (var y = 0; y < height; y++)
        {
            TryEnqueue(0, y, seed: true);
            TryEnqueue(width - 1, y, seed: true);
        }

        while (queue.Count > 0)
        {
            var (x, y) = queue.Dequeue();
            image[x, y] = default;

            TryEnqueue(x - 1, y, seed: false);
            TryEnqueue(x + 1, y, seed: false);
            TryEnqueue(x, y - 1, seed: false);
            TryEnqueue(x, y + 1, seed: false);
        }
    }

    private static bool LooksLikeStudioBackground(Rgba32 pixel, bool seed, Rgba32 bg, bool useBg)
    {
        var minC = Math.Min(pixel.R, Math.Min(pixel.G, pixel.B));
        var maxC = Math.Max(pixel.R, Math.Max(pixel.G, pixel.B));
        var chroma = maxC - minC;
        var luma = Luma(pixel);

        if (seed)
        {
            // Strict seeds: clean / off-white border only.
            return minC >= SeedMinChannel && chroma <= SeedMaxChroma;
        }

        // Expansion: soft floor shadows + off-white JPEG bleed connected to background.
        if (minC >= SoftShadowMinChannel && chroma <= ExpandMaxChroma && luma >= ExpandMinLuma)
            return true;

        if (useBg)
        {
            var dr = Math.Abs(pixel.R - bg.R);
            var dg = Math.Abs(pixel.G - bg.G);
            var db = Math.Abs(pixel.B - bg.B);
            var delta = Math.Max(dr, Math.Max(dg, db));
            if (delta <= SoftShadowMaxColorDelta && luma >= ExpandMinLuma && chroma <= ExpandMaxChroma + 6)
                return true;
        }

        return false;
    }

    /// <summary>
    /// Converts remaining near-background fringe into soft alpha (keeps anti-aliased edges).
    /// </summary>
    private static void ApplySoftMatteNearBackground(Image<Rgba32> image, Rgba32 bgSample)
    {
        var width = image.Width;
        var height = image.Height;

        for (var y = 0; y < height; y++)
        {
            for (var x = 0; x < width; x++)
            {
                var pixel = image[x, y];
                if (pixel.A <= AlphaBackgroundThreshold)
                {
                    image[x, y] = default;
                    continue;
                }

                if (!TouchesTransparent(image, x, y))
                    continue;

                var softAlpha = SoftMatteAlpha(pixel, bgSample);
                if (softAlpha >= pixel.A)
                    continue;

                pixel.A = softAlpha;
                image[x, y] = pixel.A <= AlphaBackgroundThreshold ? default : pixel;
            }
        }
    }

    private static bool TouchesTransparent(Image<Rgba32> image, int x, int y)
    {
        var w = image.Width;
        var h = image.Height;
        for (var dy = -1; dy <= 1; dy++)
        {
            for (var dx = -1; dx <= 1; dx++)
            {
                if (dx == 0 && dy == 0)
                    continue;
                var nx = x + dx;
                var ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= w || ny >= h)
                    return true;
                if (image[nx, ny].A <= AlphaBackgroundThreshold)
                    return true;
            }
        }

        return false;
    }

    private static byte SoftMatteAlpha(Rgba32 pixel, Rgba32 bg)
    {
        var minC = Math.Min(pixel.R, Math.Min(pixel.G, pixel.B));
        var chroma = Math.Max(pixel.R, Math.Max(pixel.G, pixel.B)) - minC;
        var luma = Luma(pixel);

        // Distance from pure background whites toward product.
        // Higher similarity to white/bg → lower alpha.
        var whiteScore = minC / 255f;
        var lowChroma = 1f - Math.Min(1f, chroma / 40f);
        var bgDist = Math.Max(
            Math.Abs(pixel.R - bg.R),
            Math.Max(Math.Abs(pixel.G - bg.G), Math.Abs(pixel.B - bg.B))) / 255f;

        var bgLikeness = (whiteScore * 0.55f) + (lowChroma * 0.25f) + ((1f - bgDist) * 0.20f);

        if (luma < 0.55f || bgLikeness < 0.55f)
            return pixel.A;

        // Map likeness 0.55→1.0 into alpha 255→0 for fringe only.
        var t = (bgLikeness - 0.55f) / 0.45f;
        t = Math.Clamp(t, 0f, 1f);
        var keyed = (byte)Math.Clamp((int)Math.Round((1f - t) * 255f), 0, 255);
        return Math.Min(pixel.A, keyed);
    }

    /// <summary>
    /// Remove white color spill from semi-transparent edge pixels (un-premultiply against white/bg).
    /// </summary>
    private static void DespillEdgeHalo(Image<Rgba32> image)
    {
        var bg = new Rgba32(255, 255, 255, 255);
        var width = image.Width;
        var height = image.Height;

        for (var y = 0; y < height; y++)
        {
            for (var x = 0; x < width; x++)
            {
                var pixel = image[x, y];
                if (pixel.A <= AlphaBackgroundThreshold)
                {
                    image[x, y] = default;
                    continue;
                }

                if (pixel.A >= 250)
                {
                    if (TouchesTransparent(image, x, y)
                        && Math.Min(pixel.R, Math.Min(pixel.G, pixel.B)) >= 245
                        && MaxChroma(pixel) <= 12)
                    {
                        image[x, y] = default;
                    }

                    continue;
                }

                var a = pixel.A / 255f;
                if (a <= 0.01f)
                {
                    image[x, y] = default;
                    continue;
                }

                var r = (pixel.R - (bg.R * (1f - a))) / a;
                var g = (pixel.G - (bg.G * (1f - a))) / a;
                var b = (pixel.B - (bg.B * (1f - a))) / a;

                pixel.R = (byte)Math.Clamp((int)Math.Round(r), 0, 255);
                pixel.G = (byte)Math.Clamp((int)Math.Round(g), 0, 255);
                pixel.B = (byte)Math.Clamp((int)Math.Round(b), 0, 255);

                if (Math.Min(pixel.R, Math.Min(pixel.G, pixel.B)) >= 240 && MaxChroma(pixel) <= 14)
                {
                    pixel.A = (byte)Math.Min(pixel.A, (byte)40);
                    if (pixel.A <= AlphaBackgroundThreshold)
                    {
                        image[x, y] = default;
                        continue;
                    }
                }

                image[x, y] = pixel;
            }
        }
    }

    private static void ZeroRgbOnTransparent(Image<Rgba32> image)
    {
        image.ProcessPixelRows(accessor =>
        {
            for (var y = 0; y < accessor.Height; y++)
            {
                var row = accessor.GetRowSpan(y);
                for (var x = 0; x < row.Length; x++)
                {
                    ref var pixel = ref row[x];
                    if (pixel.A <= AlphaBackgroundThreshold)
                        pixel = default;
                }
            }
        });
    }

    private static void FeatherTransparentEdges(Image<Rgba32> image, int radius)
    {
        if (radius <= 0)
            return;

        var width = image.Width;
        var height = image.Height;
        var distance = new ushort[width * height];
        const ushort Inf = ushort.MaxValue;
        Array.Fill(distance, Inf);

        var queue = new Queue<(int X, int Y)>();

        image.ProcessPixelRows(accessor =>
        {
            for (var y = 0; y < height; y++)
            {
                var row = accessor.GetRowSpan(y);
                for (var x = 0; x < width; x++)
                {
                    if (row[x].A > AlphaBackgroundThreshold)
                        continue;

                    distance[(y * width) + x] = 0;
                    queue.Enqueue((x, y));
                }
            }
        });

        while (queue.Count > 0)
        {
            var (x, y) = queue.Dequeue();
            var d = distance[(y * width) + x];
            if (d >= radius)
                continue;

            for (var dy = -1; dy <= 1; dy++)
            {
                for (var dx = -1; dx <= 1; dx++)
                {
                    if (dx == 0 && dy == 0)
                        continue;

                    var nx = x + dx;
                    var ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                        continue;

                    var ni = (ny * width) + nx;
                    var nd = (ushort)(d + 1);
                    if (nd >= distance[ni] || nd > radius)
                        continue;

                    distance[ni] = nd;
                    queue.Enqueue((nx, ny));
                }
            }
        }

        image.ProcessPixelRows(accessor =>
        {
            for (var y = 0; y < height; y++)
            {
                var row = accessor.GetRowSpan(y);
                for (var x = 0; x < width; x++)
                {
                    ref var pixel = ref row[x];
                    if (pixel.A <= AlphaBackgroundThreshold)
                        continue;

                    var d = distance[(y * width) + x];
                    if (d == 0 || d > radius)
                        continue;

                    var factor = d / (float)(radius + 1);
                    pixel.A = (byte)Math.Clamp((int)Math.Round(pixel.A * factor), 0, 255);
                    if (pixel.A <= AlphaBackgroundThreshold)
                        pixel = default;
                }
            }
        });
    }

    private static Rectangle DetectContentBounds(Image<Rgba32> image)
    {
        var minX = image.Width;
        var minY = image.Height;
        var maxX = -1;
        var maxY = -1;
        var found = false;

        image.ProcessPixelRows(accessor =>
        {
            for (var y = 0; y < accessor.Height; y++)
            {
                var row = accessor.GetRowSpan(y);
                for (var x = 0; x < row.Length; x++)
                {
                    if (row[x].A <= AlphaBackgroundThreshold)
                        continue;

                    found = true;
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        });

        return found ? Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1) : Rectangle.Empty;
    }

    private static float Luma(Rgba32 p) =>
        ((0.299f * p.R) + (0.587f * p.G) + (0.114f * p.B)) / 255f;

    private static int MaxChroma(Rgba32 p) =>
        Math.Max(p.R, Math.Max(p.G, p.B)) - Math.Min(p.R, Math.Min(p.G, p.B));

    private static async Task SaveResizedWithTempAsync(
        Image<Rgba32> source,
        string outputPath,
        int size,
        List<string> tempPaths,
        CancellationToken cancellationToken)
    {
        using var resized = source.Clone(ctx => ctx.Resize(size, size, KnownResamplers.Lanczos3));
        ZeroRgbOnTransparent(resized);
        DespillEdgeHalo(resized);
        ZeroRgbOnTransparent(resized);
        await SaveWithTempAsync(resized, outputPath, tempPaths, cancellationToken);
    }

    private static async Task SaveWithTempAsync(
        Image canvas,
        string outputPath,
        List<string> tempPaths,
        CancellationToken cancellationToken)
    {
        var tempPath = outputPath + ".normalize.tmp";
        tempPaths.Add(tempPath);

        await SaveTransparentImageAsync(canvas, tempPath, cancellationToken);
        File.Move(tempPath, outputPath, overwrite: true);
        tempPaths.Remove(tempPath);
    }

    private static async Task SaveTransparentImageAsync(
        Image canvas,
        string absoluteFilePath,
        CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(absoluteFilePath).ToLowerInvariant();

        switch (extension)
        {
            case ".webp":
                await canvas.SaveAsWebpAsync(
                    absoluteFilePath,
                    new WebpEncoder
                    {
                        Quality = WebpQuality,
                        FileFormat = WebpFileFormatType.Lossless
                    },
                    cancellationToken);
                break;

            default:
                await canvas.SaveAsPngAsync(
                    absoluteFilePath,
                    new PngEncoder
                    {
                        CompressionLevel = PngCompressionLevel.Level6,
                        ColorType = PngColorType.RgbWithAlpha
                    },
                    cancellationToken);
                break;
        }
    }

    private static void CleanupStaleDerivatives(string inputPath, string outputPath)
    {
        var inputDir = Path.GetDirectoryName(inputPath);
        var inputBase = Path.GetFileNameWithoutExtension(inputPath);
        if (string.IsNullOrEmpty(inputDir) || string.IsNullOrEmpty(inputBase))
            return;

        var outputExt = Path.GetExtension(outputPath);
        string[] legacyExts = [".jpg", ".jpeg", ".png", ".webp"];

        foreach (var ext in legacyExts)
        {
            if (string.Equals(ext, outputExt, StringComparison.OrdinalIgnoreCase))
                continue;

            TryDelete(Path.Combine(inputDir, inputBase + ext));
            TryDelete(Path.Combine(inputDir, $"{inputBase}_{ProductImageUrlHelper.MediumSize}{ext}"));
            TryDelete(Path.Combine(inputDir, $"{inputBase}_{ProductImageUrlHelper.SmallSize}{ext}"));
        }
    }

    private static void TryDelete(string path)
    {
        if (!File.Exists(path))
            return;

        try
        {
            File.Delete(path);
        }
        catch
        {
            // Best effort.
        }
    }

    private static void CleanupTempFiles(IEnumerable<string> tempPaths)
    {
        foreach (var tempPath in tempPaths)
            TryDelete(tempPath);
    }
}
