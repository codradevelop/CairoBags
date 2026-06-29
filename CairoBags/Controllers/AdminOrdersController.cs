using System.Security.Claims;
using CairoBags.Dto.Orders;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
public class AdminOrdersController : ControllerBase
{
    private readonly IAdminOrderService _adminOrderService;

    public AdminOrdersController(IAdminOrderService adminOrderService)
    {
        _adminOrderService = adminOrderService;
    }

    [HttpGet("/api/admin/orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] AdminOrderFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var orders = await _adminOrderService.GetOrdersAsync(filter, cancellationToken);
        return Ok(orders);
    }

    [HttpGet("/api/admin/orders/{id:int}")]
    public async Task<IActionResult> GetOrderById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _adminOrderService.GetOrderByIdAsync(id, cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpPost("/api/admin/orders/{id:int}/processing")]
    public async Task<IActionResult> MoveToProcessing(int id, CancellationToken cancellationToken = default)
    {
        var result = await _adminOrderService.MoveToProcessingAsync(id, GetUserId()!, cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpPost("/api/admin/orders/{id:int}/shipped")]
    public async Task<IActionResult> MoveToShipped(int id, CancellationToken cancellationToken = default)
    {
        var result = await _adminOrderService.MoveToShippedAsync(id, GetUserId()!, cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpPost("/api/admin/orders/{id:int}/delivered")]
    public async Task<IActionResult> MoveToDelivered(int id, CancellationToken cancellationToken = default)
    {
        var result = await _adminOrderService.MoveToDeliveredAsync(id, GetUserId()!, cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpPost("/api/admin/orders/{id:int}/cancel")]
    public async Task<IActionResult> CancelOrder(int id, CancellationToken cancellationToken = default)
    {
        var result = await _adminOrderService.CancelOrderAsync(id, GetUserId()!, cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpPost("/api/admin/orders/{id:int}/refund")]
    public async Task<IActionResult> RefundOrder(int id, CancellationToken cancellationToken = default)
    {
        var result = await _adminOrderService.RefundOrderAsync(id, GetUserId()!, cancellationToken);
        return ToActionResult(result, data => Ok(data));
    }

    [HttpPost("/api/admin/orders/{id:int}/cod-status")]
    public async Task<IActionResult> UpdateCodOrderStatus(
        int id,
        [FromBody] UpdateCodOrderStatusRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminOrderService.UpdateCodOrderStatusAsync(
            id,
            request.Status,
            GetUserId()!,
            cancellationToken);
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
            StatusCodes.Status409Conflict => Conflict(new { code = result.ErrorCode, message = result.Message }),
            _ => BadRequest(new { code = result.ErrorCode, message = result.Message })
        };
    }
}
