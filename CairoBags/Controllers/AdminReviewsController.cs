using CairoBags.Dto.Reviews;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
public class AdminReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public AdminReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpDelete("/api/admin/reviews/{id:int}")]
    public async Task<IActionResult> DeleteReview(int id, CancellationToken cancellationToken)
    {
        var result = await _reviewService.AdminDeleteReviewAsync(id, cancellationToken);
        return ToActionResult(result, _ => NoContent());
    }

    [HttpPatch("/api/admin/reviews/{id:int}/visibility")]
    public async Task<IActionResult> SetVisibility(
        int id,
        [FromBody] SetReviewVisibilityRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _reviewService.AdminSetVisibilityAsync(id, request.IsVisible, cancellationToken);
        return ToActionResult(result, Ok);
    }

    [HttpGet("/api/admin/reviews/latest")]
    public async Task<IActionResult> GetLatestReviews(
        [FromQuery] int limit = 5,
        CancellationToken cancellationToken = default)
    {
        var reviews = await _reviewService.GetLatestReviewsForAdminAsync(limit, cancellationToken);
        return Ok(reviews);
    }

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
