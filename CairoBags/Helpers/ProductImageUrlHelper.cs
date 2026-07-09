namespace CairoBags.Helpers;

public static class ProductImageUrlHelper
{
    public const int OriginalSize = 1200;
    public const int MediumSize = 600;
    public const int SmallSize = 300;

    public static string GetMediumThumbnailUrl(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            return imageUrl;

        return GetDerivativeUrl(imageUrl.Trim(), MediumSize);
    }

    public static string GetSmallThumbnailUrl(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            return imageUrl;

        return GetDerivativeUrl(imageUrl.Trim(), SmallSize);
    }

    public static string? ResolveListingUrl(string? imageUrl, string? thumbnailUrl)
    {
        if (!string.IsNullOrWhiteSpace(thumbnailUrl))
            return thumbnailUrl.Trim();

        if (string.IsNullOrWhiteSpace(imageUrl))
            return null;

        // Keep legacy records visible: if medium thumbnail isn't stored, use the original.
        return imageUrl.Trim();
    }

    public static string? ResolveCompactUrl(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            return null;

        return GetSmallThumbnailUrl(imageUrl.Trim());
    }

    private static string GetDerivativeUrl(string imageUrl, int size)
    {
        var extension = Path.GetExtension(imageUrl);
        if (string.IsNullOrEmpty(extension))
            return imageUrl;

        var basePath = imageUrl[..^extension.Length];
        var suffix = $"_{size}";
        if (basePath.EndsWith(suffix, StringComparison.OrdinalIgnoreCase))
            return imageUrl;

        return $"{basePath}{suffix}{extension}";
    }
}
