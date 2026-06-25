using System.Security.Claims;
using CairoBags.Dto.Reviews;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
[Authorize(Roles = "Customer,Admin")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpPut("/api/reviews/{id:int}")]
    public async Task<IActionResult> UpdateReview(
        int id,
        [FromBody] UpdateReviewRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _reviewService.UpdateReviewAsync(id, userId, request, cancellationToken);
        return ToActionResult(result, Ok);
    }

    [HttpDelete("/api/reviews/{id:int}")]
    public async Task<IActionResult> DeleteReview(int id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _reviewService.DeleteReviewAsync(id, userId, cancellationToken);
        return ToActionResult(result, _ => NoContent());
    }

    [HttpPost("/api/reviews/{id:int}/helpful")]
    public async Task<IActionResult> MarkHelpful(int id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _reviewService.MarkHelpfulAsync(id, userId, cancellationToken);
        return ToActionResult(result, Ok);
    }

    [HttpDelete("/api/reviews/{id:int}/helpful")]
    public async Task<IActionResult> RemoveHelpful(int id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _reviewService.RemoveHelpfulAsync(id, userId, cancellationToken);
        return ToActionResult(result, Ok);
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
