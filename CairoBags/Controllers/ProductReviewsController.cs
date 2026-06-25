using System.Security.Claims;
using CairoBags.Dto.Reviews;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
public class ProductReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ProductReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpGet("/api/products/{productId:int}/reviews")]
    [AllowAnonymous]
    public async Task<IActionResult> GetReviews(
        int productId,
        [FromQuery] ReviewListQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _reviewService.GetProductReviewsAsync(productId, query, GetUserId(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("/api/products/{productId:int}/reviews/summary")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSummary(int productId, CancellationToken cancellationToken)
    {
        var summary = await _reviewService.GetProductReviewSummaryAsync(productId, cancellationToken);
        if (summary == null)
            return NotFound(new { message = "Product not found." });

        return Ok(summary);
    }

    [HttpPost("/api/products/{productId:int}/reviews")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> CreateReview(
        int productId,
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _reviewService.CreateReviewAsync(productId, userId, request, cancellationToken);
        return ToActionResult(result, created => CreatedAtAction(nameof(GetReviews), new { productId }, created));
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
            StatusCodes.Status403Forbidden => Forbid(),
            StatusCodes.Status409Conflict => Conflict(new { code = result.ErrorCode, message = result.Message }),
            _ => BadRequest(new { code = result.ErrorCode, message = result.Message })
        };
    }
}
