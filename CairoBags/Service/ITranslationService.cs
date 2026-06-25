namespace CairoBags.Service;

public interface ITranslationService
{
    Task<string?> TranslateAsync(string text, string from = "ar", string to = "en", CancellationToken cancellationToken = default);
}
