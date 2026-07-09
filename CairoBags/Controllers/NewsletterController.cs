using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CairoBags.Dto.Marketing;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CairoBags.Controllers;

[ApiController]
[AllowAnonymous]
public class NewsletterController : ControllerBase
{
    private readonly INewsletterService _newsletterService;

    public NewsletterController(INewsletterService newsletterService)
    {
        _newsletterService = newsletterService;
    }

    [HttpGet("/api/newsletter/me")]
    public async Task<IActionResult> GetMySubscriptionStatus(CancellationToken cancellationToken = default)
    {
        var email = User.Identity?.IsAuthenticated == true ? GetCurrentUserEmail() : null;
        var status = await _newsletterService.GetSubscriptionStatusAsync(email, cancellationToken);
        return Ok(status);
    }

    [HttpPost("/api/newsletter/subscribe")]
    [EnableRateLimiting("newsletter")]
    public async Task<IActionResult> Subscribe(
        [FromBody] SubscribeNewsletterRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { code = "invalid_email", message = "Please enter a valid email address." });

        var result = await _newsletterService.SubscribeAsync(request, cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpPost("/api/newsletter/unsubscribe")]
    [EnableRateLimiting("newsletter")]
    public async Task<IActionResult> Unsubscribe(
        [FromBody] UnsubscribeNewsletterRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { code = "invalid_token", message = "Invalid unsubscribe link." });

        var result = await _newsletterService.UnsubscribeAsync(request.Token, cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    private string? GetCurrentUserEmail() =>
        User.FindFirstValue(ClaimTypes.Email)
        ?? User.FindFirstValue(JwtRegisteredClaimNames.Email);

    private IActionResult ToActionResult<T>(ServiceResult<T> result, Func<T, IActionResult> onSuccess)
    {
        if (result.Succeeded && result.Data != null)
            return onSuccess(result.Data);

        return (result.StatusCode ?? StatusCodes.Status400BadRequest) switch
        {
            StatusCodes.Status404NotFound => NotFound(new { code = result.ErrorCode, message = result.Message }),
            _ => BadRequest(new { code = result.ErrorCode, message = result.Message })
        };
    }
}
