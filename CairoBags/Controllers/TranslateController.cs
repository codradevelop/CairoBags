using CairoBags.Dto.Translation;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
[Route("api/translate")]
[Authorize(Roles = "Admin")]
public class TranslateController : ControllerBase
{
    private readonly ITranslationService _translationService;

    public TranslateController(ITranslationService translationService)
    {
        _translationService = translationService;
    }

    [HttpPost]
    public async Task<ActionResult<TranslateResponseDto>> Translate(
        [FromBody] TranslateRequestDto request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return Ok(new TranslateResponseDto { TranslatedText = string.Empty });
        }

        var from = string.IsNullOrWhiteSpace(request.From) ? "ar" : request.From.Trim();
        var to = string.IsNullOrWhiteSpace(request.To) ? "en" : request.To.Trim();

        var translated = await _translationService.TranslateAsync(request.Text, from, to, cancellationToken);
        if (translated == null)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "Translation service is temporarily unavailable.",
            });
        }

        return Ok(new TranslateResponseDto { TranslatedText = translated });
    }
}
