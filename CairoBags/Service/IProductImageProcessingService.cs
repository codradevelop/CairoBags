namespace CairoBags.Service;

/// <summary>
/// Normalizes newly uploaded product images to a consistent square canvas.
/// </summary>
public interface IProductImageProcessingService
{
    /// <summary>
    /// Trims empty margins, centers the product on a square canvas, generates thumbnails,
    /// and overwrites/replaces the uploaded file in place.
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
