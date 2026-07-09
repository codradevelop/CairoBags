namespace CairoBags.Service;

public sealed class ProductImageProcessingResult
{
    public bool Succeeded { get; init; }

    public string? OriginalAbsolutePath { get; init; }

    public string? MediumAbsolutePath { get; init; }

    public string? SmallAbsolutePath { get; init; }

    public static ProductImageProcessingResult Failed() => new() { Succeeded = false };

    public static ProductImageProcessingResult Ok(
        string originalAbsolutePath,
        string mediumAbsolutePath,
        string smallAbsolutePath) =>
        new()
        {
            Succeeded = true,
            OriginalAbsolutePath = originalAbsolutePath,
            MediumAbsolutePath = mediumAbsolutePath,
            SmallAbsolutePath = smallAbsolutePath
        };
}
