using System.Security.Claims;
using CairoBags.Dto.Catalog;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
public class CategoryController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoryController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    /// <summary>Storefront: active categories. Admin: pass includeInactive=true to list all.</summary>
    [HttpGet("/api/categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories([FromQuery] bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        if (includeInactive)
        {
            if (!User.IsInRole("Admin"))
                return Forbid();

            var all = await _categoryService.GetAllCategoriesAsync(cancellationToken);
            return Ok(all);
        }

        var active = await _categoryService.GetActiveCategoriesAsync(cancellationToken);
        return Ok(active);
    }

    [HttpGet("/api/categories/tree")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategoryTree(CancellationToken cancellationToken = default)
    {
        var tree = await _categoryService.GetActiveCategoryTreeAsync(cancellationToken);
        return Ok(tree);
    }

    [HttpGet("/api/categories/{identifier}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByIdentifier(
        string identifier,
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        if (includeInactive && !User.IsInRole("Admin"))
            return Forbid();

        var category = int.TryParse(identifier, out var id)
            ? await _categoryService.GetByIdAsync(id, includeInactive, cancellationToken)
            : await _categoryService.GetBySlugAsync(identifier, includeInactive, cancellationToken);

        if (category == null)
            return NotFound(new { message = "Category not found." });

        return Ok(category);
    }

    [HttpPost("/api/admin/categories")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _categoryService.CreateAsync(request, GetUserId(), cancellationToken);
        return ToActionResult(result, created => CreatedAtAction(nameof(GetByIdentifier), new { identifier = created.Id, includeInactive = true }, created));
    }

    [HttpPut("/api/admin/categories/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _categoryService.UpdateAsync(id, request, GetUserId(), cancellationToken);
        return ToActionResult(result, Ok);
    }

    [HttpDelete("/api/admin/categories/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var result = await _categoryService.DeleteAsync(id, GetUserId(), cancellationToken);
        return ToActionResult(result, _ => NoContent());
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
            _ => BadRequest(new { code = result.ErrorCode, message = result.Message })
        };
    }
}
