using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CairoBags.Service;

public class TranslationService : ITranslationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<TranslationService> _logger;

    public TranslationService(
        HttpClient httpClient,
        IConfiguration configuration,
        IMemoryCache cache,
        ILogger<TranslationService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _cache = cache;
        _logger = logger;
    }

    public async Task<string?> TranslateAsync(
        string text,
        string from = "ar",
        string to = "en",
        CancellationToken cancellationToken = default)
    {
        var trimmed = text?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(trimmed))
            return string.Empty;

        var cacheKey = $"translate:{from}:{to}:{trimmed}";
        if (_cache.TryGetValue(cacheKey, out string? cached) && cached != null)
            return cached;

        var libreUrl = _configuration["Translation:LibreTranslateUrl"];
        var libreKey = _configuration["Translation:LibreTranslateApiKey"];

        // Provider chain: LibreTranslate (if configured) → MyMemory → future providers
        if (!string.IsNullOrWhiteSpace(libreUrl))
        {
            var libreResult = await TryLibreTranslateAsync(trimmed, from, to, libreUrl, libreKey, cancellationToken);
            if (libreResult != null)
            {
                CacheResult(cacheKey, libreResult);
                return libreResult;
            }

            _logger.LogDebug("LibreTranslate unavailable, falling back to MyMemory");
        }

        var myMemoryResult = await TryMyMemoryAsync(trimmed, from, to, cancellationToken);
        if (myMemoryResult != null)
        {
            CacheResult(cacheKey, myMemoryResult);
            return myMemoryResult;
        }

        _logger.LogWarning("All translation providers failed for {From}->{To}", from, to);
        return null;
    }

    private void CacheResult(string cacheKey, string value)
    {
        _cache.Set(cacheKey, value, TimeSpan.FromHours(12));
    }

    private async Task<string?> TryMyMemoryAsync(
        string text,
        string from,
        string to,
        CancellationToken cancellationToken)
    {
        try
        {
            var baseUrl = _configuration["Translation:MyMemoryUrl"] ?? "https://api.mymemory.translated.net/get";
            var url = $"{baseUrl}?q={Uri.EscapeDataString(text)}&langpair={from}|{to}";

            using var response = await _httpClient.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
                return null;

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

            var translated = document.RootElement
                .GetProperty("responseData")
                .GetProperty("translatedText")
                .GetString();

            if (string.IsNullOrWhiteSpace(translated))
                return null;

            if (translated.Contains("MYMEMORY WARNING", StringComparison.OrdinalIgnoreCase))
                return null;

            return translated.Trim();
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "MyMemory translation failed");
            return null;
        }
    }

    private async Task<string?> TryLibreTranslateAsync(
        string text,
        string from,
        string to,
        string libreUrl,
        string? apiKey,
        CancellationToken cancellationToken)
    {
        try
        {
            var payload = new Dictionary<string, object>
            {
                ["q"] = text,
                ["source"] = from,
                ["target"] = to,
                ["format"] = "text",
            };

            if (!string.IsNullOrWhiteSpace(apiKey))
                payload["api_key"] = apiKey;

            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");
            using var response = await _httpClient.PostAsync(libreUrl, content, cancellationToken);

            if (!response.IsSuccessStatusCode)
                return null;

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

            if (document.RootElement.TryGetProperty("translatedText", out var translatedElement))
            {
                var translated = translatedElement.GetString();
                return string.IsNullOrWhiteSpace(translated) ? null : translated.Trim();
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "LibreTranslate failed");
            return null;
        }
    }
}
