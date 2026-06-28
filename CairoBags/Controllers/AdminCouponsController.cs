using System.Security.Claims;
using CairoBags.Dto.Coupons;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
public class AdminCouponsController : ControllerBase
{
    private readonly ICouponService _couponService;

    public AdminCouponsController(ICouponService couponService)
    {
        _couponService = couponService;
    }

    [HttpGet("/api/admin/coupons/stats")]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken = default)
    {
        var stats = await _couponService.GetStatsAsync(cancellationToken);
        return Ok(stats);
    }

    [HttpGet("/api/admin/coupons")]
    public async Task<IActionResult> GetCoupons(
        [FromQuery] AdminCouponFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var coupons = await _couponService.GetCouponsAsync(filter, cancellationToken);
        return Ok(coupons);
    }

    [HttpGet("/api/admin/coupons/{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _couponService.GetByIdAsync(id, cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpGet("/api/admin/coupons/{id:int}/usage")]
    public async Task<IActionResult> GetUsageHistory(
        int id,
        [FromQuery] AdminCouponUsageFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var result = await _couponService.GetUsageHistoryAsync(id, filter, cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpPost("/api/admin/coupons")]
    public async Task<IActionResult> Create(
        [FromBody] CreateCouponRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _couponService.CreateAsync(request, GetUserId(), cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpPut("/api/admin/coupons/{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateCouponRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _couponService.UpdateAsync(id, request, GetUserId(), cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpDelete("/api/admin/coupons/{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var result = await _couponService.DeleteAsync(id, cancellationToken);
        return ToActionResult(result, _ => NoContent());
    }

    [HttpPost("/api/admin/coupons/{id:int}/activate")]
    public async Task<IActionResult> Activate(int id, CancellationToken cancellationToken = default)
    {
        var result = await _couponService.SetActiveAsync(id, true, GetUserId(), cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpPost("/api/admin/coupons/{id:int}/deactivate")]
    public async Task<IActionResult> Deactivate(int id, CancellationToken cancellationToken = default)
    {
        var result = await _couponService.SetActiveAsync(id, false, GetUserId(), cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpPost("/api/admin/coupons/{id:int}/duplicate")]
    public async Task<IActionResult> Duplicate(int id, CancellationToken cancellationToken = default)
    {
        var result = await _couponService.DuplicateAsync(id, GetUserId(), cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    private string? GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ??
        User.FindFirstValue("sub");

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
