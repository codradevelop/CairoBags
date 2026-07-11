using CairoBags.Helpers;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace CairoBags.Service;

public sealed class ProductImageProcessingService : IProductImageProcessingService
{
    private const int MaxInputDimension = 2500;
    private const float ProductFillRatio = 0.875f;
    private const byte NearWhiteThreshold = 245;
    private const byte NearBlackThreshold = 35;
    private const byte AlphaBackgroundThreshold = 25;
    private const int JpegQuality = 92;
    private const int WebpQuality = 92;

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

            StripEdgeConnectedBackground(image);

            var bounds = DetectContentBounds(image);
            if (bounds.Width <= 0 || bounds.Height <= 0)
                return ProductImageProcessingResult.Failed();

            using var cropped = image.Clone(ctx => ctx.Crop(bounds));
            var preserveTransparency = ShouldPreserveTransparency(cropped);
            var outputExtension = GetOutputExtension(inputExtension, preserveTransparency);
            var backgroundColor = preserveTransparency
                ? new Rgba32(0, 0, 0, 0)
                : new Rgba32(255, 255, 255, 255);

            var targetMax = (int)Math.Round(ProductImageUrlHelper.OriginalSize * ProductFillRatio);
            var scale = Math.Min(
                targetMax / (float)cropped.Width,
                targetMax / (float)cropped.Height);

            var scaledWidth = Math.Max(1, (int)Math.Round(cropped.Width * scale));
            var scaledHeight = Math.Max(1, (int)Math.Round(cropped.Height * scale));

            using var scaled = cropped.Clone(ctx => ctx.Resize(scaledWidth, scaledHeight, KnownResamplers.Lanczos3));
            using var canvas = new Image<Rgba32>(ProductImageUrlHelper.OriginalSize, ProductImageUrlHelper.OriginalSize, backgroundColor);

            var offsetX = (ProductImageUrlHelper.OriginalSize - scaledWidth) / 2;
            var offsetY = (ProductImageUrlHelper.OriginalSize - scaledHeight) / 2;
            canvas.Mutate(ctx => ctx.DrawImage(scaled, new Point(offsetX, offsetY), 1f));

            var outputBasePath = Path.Combine(
                Path.GetDirectoryName(absoluteFilePath)!,
                Path.GetFileNameWithoutExtension(absoluteFilePath));

            var originalOutputPath = outputBasePath + outputExtension;
            var mediumOutputPath = ProductImageUrlHelper.GetMediumThumbnailUrl(originalOutputPath);
            var smallOutputPath = ProductImageUrlHelper.GetSmallThumbnailUrl(originalOutputPath);

            await SaveWithTempAsync(canvas, originalOutputPath, preserveTransparency, tempPaths, cancellationToken);
            await SaveResizedWithTempAsync(
                canvas,
                mediumOutputPath,
                ProductImageUrlHelper.MediumSize,
                preserveTransparency,
                tempPaths,
                cancellationToken);
            await SaveResizedWithTempAsync(
                canvas,
                smallOutputPath,
                ProductImageUrlHelper.SmallSize,
                preserveTransparency,
                tempPaths,
                cancellationToken);

            if (!string.Equals(absoluteFilePath, originalOutputPath, StringComparison.OrdinalIgnoreCase)
                && File.Exists(absoluteFilePath))
            {
                File.Delete(absoluteFilePath);
            }

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

    private static string GetOutputExtension(string inputExtension, bool preserveTransparency)
    {
        if (!preserveTransparency)
            return ".jpg";

        return inputExtension.ToLowerInvariant() switch
        {
            ".webp" => ".webp",
            _ => ".png"
        };
    }

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
                    if (IsBackgroundPixel(row[x]))
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

    private static bool IsBackgroundPixel(Rgba32 pixel) =>
        pixel.A <= AlphaBackgroundThreshold
        || (pixel.R >= NearWhiteThreshold
            && pixel.G >= NearWhiteThreshold
            && pixel.B >= NearWhiteThreshold);

    private static bool IsDarkBackgroundCandidate(Rgba32 pixel) =>
        pixel.R + pixel.G + pixel.B <= NearBlackThreshold;

    private static bool HasUniformDarkCornerBackground(Image<Rgba32> image)
    {
        if (image.Width < 2 || image.Height < 2)
            return false;

        Span<Rgba32> corners =
        [
            image[0, 0],
            image[image.Width - 1, 0],
            image[0, image.Height - 1],
            image[image.Width - 1, image.Height - 1]
        ];

        var darkCornerCount = 0;
        foreach (var corner in corners)
        {
            if (IsDarkBackgroundCandidate(corner))
                darkCornerCount++;
        }

        return darkCornerCount >= 3;
    }

    private static void StripEdgeConnectedBackground(Image<Rgba32> image)
    {
        if (!HasUniformDarkCornerBackground(image))
            return;

        var width = image.Width;
        var height = image.Height;
        var visited = new bool[width * height];
        var queue = new Queue<(int X, int Y)>();

        void TryEnqueue(int x, int y)
        {
            if (x < 0 || x >= width || y < 0 || y >= height)
                return;

            var index = (y * width) + x;
            if (visited[index])
                return;

            if (!IsDarkBackgroundCandidate(image[x, y]))
                return;

            visited[index] = true;
            queue.Enqueue((x, y));
        }

        for (var x = 0; x < width; x++)
        {
            TryEnqueue(x, 0);
            TryEnqueue(x, height - 1);
        }

        for (var y = 0; y < height; y++)
        {
            TryEnqueue(0, y);
            TryEnqueue(width - 1, y);
        }

        while (queue.Count > 0)
        {
            var (x, y) = queue.Dequeue();
            image[x, y] = new Rgba32(0, 0, 0, 0);

            TryEnqueue(x - 1, y);
            TryEnqueue(x + 1, y);
            TryEnqueue(x, y - 1);
            TryEnqueue(x, y + 1);
        }
    }

    private static bool ShouldPreserveTransparency(Image<Rgba32> image)
    {
        var hasTransparentProductPixels = false;

        image.ProcessPixelRows(accessor =>
        {
            for (var y = 0; y < accessor.Height && !hasTransparentProductPixels; y++)
            {
                var row = accessor.GetRowSpan(y);
                for (var x = 0; x < row.Length; x++)
                {
                    if (IsBackgroundPixel(row[x]))
                        continue;

                    if (row[x].A < 250)
                    {
                        hasTransparentProductPixels = true;
                        break;
                    }
                }
            }
        });

        return hasTransparentProductPixels;
    }

    private static async Task SaveResizedWithTempAsync(
        Image<Rgba32> source,
        string outputPath,
        int size,
        bool preserveTransparency,
        List<string> tempPaths,
        CancellationToken cancellationToken)
    {
        using var resized = source.Clone(ctx => ctx.Resize(size, size, KnownResamplers.Lanczos3));
        await SaveWithTempAsync(resized, outputPath, preserveTransparency, tempPaths, cancellationToken);
    }

    private static async Task SaveWithTempAsync(
        Image canvas,
        string outputPath,
        bool preserveTransparency,
        List<string> tempPaths,
        CancellationToken cancellationToken)
    {
        var tempPath = outputPath + ".normalize.tmp";
        tempPaths.Add(tempPath);

        await SaveImageAsync(canvas, tempPath, preserveTransparency, cancellationToken);
        File.Move(tempPath, outputPath, overwrite: true);
        tempPaths.Remove(tempPath);
    }

    private static async Task SaveImageAsync(
        Image canvas,
        string absoluteFilePath,
        bool preserveTransparency,
        CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(absoluteFilePath).ToLowerInvariant();
        var useJpeg = !preserveTransparency || extension is ".jpg" or ".jpeg";

        if (useJpeg)
        {
            await canvas.SaveAsJpegAsync(
                absoluteFilePath,
                new JpegEncoder { Quality = JpegQuality },
                cancellationToken);
            return;
        }

        switch (extension)
        {
            case ".png":
                await canvas.SaveAsPngAsync(
                    absoluteFilePath,
                    new PngEncoder
                    {
                        CompressionLevel = PngCompressionLevel.Level6,
                        ColorType = PngColorType.RgbWithAlpha
                    },
                    cancellationToken);
                break;

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
                await canvas.SaveAsJpegAsync(
                    absoluteFilePath,
                    new JpegEncoder { Quality = JpegQuality },
                    cancellationToken);
                break;
        }
    }

    private static void CleanupTempFiles(IEnumerable<string> tempPaths)
    {
        foreach (var tempPath in tempPaths)
        {
            if (!File.Exists(tempPath))
                continue;

            try
            {
                File.Delete(tempPath);
            }
            catch
            {
                // Best effort cleanup.
            }
        }
    }
}
