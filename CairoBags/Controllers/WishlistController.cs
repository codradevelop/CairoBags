using System.Security.Claims;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly IWishlistService _wishlistService;

    public WishlistController(IWishlistService wishlistService)
    {
        _wishlistService = wishlistService;
    }

    [HttpGet("/api/wishlist")]
    public async Task<IActionResult> GetWishlist(CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Authentication is required." });

        var result = await _wishlistService.GetWishlistAsync(userId, cancellationToken);
        return ToActionResult(result, Ok);
    }

    [HttpPost("/api/wishlist/{productId:int}")]
    public async Task<IActionResult> Toggle(int productId, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Authentication is required." });

        var result = await _wishlistService.ToggleAsync(userId, productId, cancellationToken);
        return ToActionResult(result, Ok);
    }

    [HttpDelete("/api/wishlist/{productId:int}")]
    public async Task<IActionResult> Remove(int productId, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Authentication is required." });

        var result = await _wishlistService.RemoveAsync(userId, productId, cancellationToken);
        return ToActionResult(result, Ok);
    }

    [HttpGet("/api/wishlist/count")]
    public async Task<IActionResult> GetCount(CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Authentication is required." });

        var result = await _wishlistService.GetCountAsync(userId, cancellationToken);
        return ToActionResult(result, Ok);
    }

    private string? GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ??
        User.FindFirstValue("sub");

    private IActionResult ToActionResult<T>(ServiceResult<T> result, Func<T, IActionResult> onSuccess)
    {
        if (result.Succeeded)
            return onSuccess(result.Data!);

        return (result.StatusCode ?? StatusCodes.Status400BadRequest) switch
        {
            StatusCodes.Status404NotFound => NotFound(new { code = result.ErrorCode, message = result.Message }),
            StatusCodes.Status401Unauthorized => Unauthorized(new { code = result.ErrorCode, message = result.Message }),
            StatusCodes.Status403Forbidden => Forbid(),
            _ => BadRequest(new { code = result.ErrorCode, message = result.Message })
        };
    }
}
