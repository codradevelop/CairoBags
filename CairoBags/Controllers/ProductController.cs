using System.Security.Claims;
using CairoBags.Dto.Catalog;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet("/api/products")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProducts(
        [FromQuery] ProductQueryFilters filters,
        [FromQuery] bool includeDraft = false,
        CancellationToken cancellationToken = default)
    {
        if (includeDraft && !User.IsInRole("Admin"))
            return Forbid();

        var storefront = !includeDraft;
        var products = await _productService.GetProductsAsync(filters, storefront, cancellationToken);
        return Ok(products);
    }

    [HttpGet("/api/products/featured")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFeatured(CancellationToken cancellationToken = default)
    {
        var products = await _productService.GetFeaturedAsync(cancellationToken);
        return Ok(products);
    }

    [HttpGet("/api/products/new-arrivals")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNewArrivals(CancellationToken cancellationToken = default)
    {
        var products = await _productService.GetNewArrivalsAsync(cancellationToken);
        return Ok(products);
    }

    [HttpGet("/api/products/search")]
    [AllowAnonymous]
    public async Task<IActionResult> Search(
        [FromQuery] ProductQueryFilters filters,
        [FromQuery] bool includeDraft = false,
        CancellationToken cancellationToken = default)
    {
        if (includeDraft && !User.IsInRole("Admin"))
            return Forbid();

        var products = await _productService.SearchAsync(filters, storefront: !includeDraft, cancellationToken);
        return Ok(products);
    }

    [HttpGet("/api/products/filter-options")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFilterOptions(CancellationToken cancellationToken = default)
    {
        var options = await _productService.GetFilterOptionsAsync(storefront: true, cancellationToken);
        return Ok(options);
    }

    [HttpGet("/api/products/{identifier}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByIdentifier(
        string identifier,
        [FromQuery] bool includeDraft = false,
        CancellationToken cancellationToken = default)
    {
        if (includeDraft && !User.IsInRole("Admin"))
            return Forbid();

        var storefront = !includeDraft;
        var product = int.TryParse(identifier, out var id)
            ? await _productService.GetByIdAsync(id, storefront, cancellationToken)
            : await _productService.GetBySlugAsync(identifier, storefront, cancellationToken);

        if (product == null)
            return NotFound(new { message = "Product not found." });

        return Ok(product);
    }

    [HttpPost("/api/admin/products")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _productService.CreateAsync(request, GetUserId(), cancellationToken);
        return ToActionResult(result, created => Created($"/api/products/{created.Id}?includeDraft=true", created));
    }

    [HttpPut("/api/admin/products/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _productService.UpdateAsync(id, request, GetUserId(), cancellationToken);
        return ToActionResult(result, Ok);
    }

    [HttpDelete("/api/admin/products/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var result = await _productService.DeleteAsync(id, GetUserId(), cancellationToken);
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
