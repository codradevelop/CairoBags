using System.Security.Claims;
using CairoBags.Dto.Marketing;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
public class AdminNewsletterController : ControllerBase
{
    private readonly INewsletterService _newsletterService;

    public AdminNewsletterController(INewsletterService newsletterService)
    {
        _newsletterService = newsletterService;
    }

    [HttpGet("/api/admin/newsletter/stats")]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken = default)
    {
        var stats = await _newsletterService.GetStatsAsync(cancellationToken);
        return Ok(stats);
    }

    [HttpGet("/api/admin/newsletter/subscribers")]
    public async Task<IActionResult> GetSubscribers(
        [FromQuery] AdminNewsletterFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var result = await _newsletterService.GetSubscribersAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("/api/admin/newsletter/export/csv")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] AdminNewsletterFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var bytes = await _newsletterService.ExportSubscribersCsvAsync(filter, cancellationToken);
        return File(bytes, "text/csv", $"newsletter-subscribers-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv");
    }

    [HttpGet("/api/admin/newsletter/export/excel")]
    public async Task<IActionResult> ExportExcel(
        [FromQuery] AdminNewsletterFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var bytes = await _newsletterService.ExportSubscribersExcelAsync(filter, cancellationToken);
        return File(bytes, "application/vnd.ms-excel", $"newsletter-subscribers-{DateTime.UtcNow:yyyyMMdd-HHmmss}.xls");
    }
}
