using System.Security.Claims;
using CairoBags.Dto.Coupons;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
[Authorize]
public class CouponsController : ControllerBase
{
    private readonly ICouponService _couponService;

    public CouponsController(ICouponService couponService)
    {
        _couponService = couponService;
    }

    [HttpPost("/api/coupons/validate")]
    public async Task<IActionResult> Validate(
        [FromBody] ValidateCouponRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Authentication is required." });

        var result = await _couponService.ValidateForCheckoutAsync(userId, request, cancellationToken);
        if (result.Succeeded && result.Data != null)
            return Ok(result.Data);

        return BadRequest(new { code = result.ErrorCode, message = result.Message });
    }

    private string? GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ??
        User.FindFirstValue("sub");
}
