namespace CairoBags.Service;

/// <summary>
/// Normalizes newly uploaded product images into transparent cutouts for the luxury storefront presentation.
/// </summary>
public interface IProductImageProcessingService
{
    /// <summary>
    /// Removes near-white studio backgrounds (color key + edge feather), trims transparent margins,
    /// centers the product on a transparent 1200×1200 canvas (~88% fill), and writes PNG/WebP
    /// derivatives (original, _600, _300). JPEG inputs are replaced — JPEG cannot keep alpha.
    /// Returns a failed result when processing is skipped; the original file is left untouched on failure.
    /// </summary>
    Task<ProductImageProcessingResult> TryNormalizeAsync(
        string absoluteFilePath,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Resolves a stored relative image URL to a physical path and normalizes it in place.
    /// </summary>
    Task<ProductImageProcessingResult> TryNormalizeByUrlAsync(
        string? imageUrl,
        CancellationToken cancellationToken = default);
}
