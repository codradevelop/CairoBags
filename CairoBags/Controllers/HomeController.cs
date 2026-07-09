using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CairoBags.Controllers;

[ApiController]
public class HomeController : ControllerBase
{
    private readonly IHomeStatisticsService _homeStatisticsService;

    public HomeController(IHomeStatisticsService homeStatisticsService)
    {
        _homeStatisticsService = homeStatisticsService;
    }

    [HttpGet("/api/home/statistics")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken = default)
    {
        var statistics = await _homeStatisticsService.GetStatisticsAsync(cancellationToken);
        return Ok(statistics);
    }
}
