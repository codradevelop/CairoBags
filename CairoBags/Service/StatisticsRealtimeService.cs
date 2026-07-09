using CairoBags.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace CairoBags.Service;

/// <summary>Recalculates home statistics and pushes them to all clients via SignalR.</summary>
public class StatisticsRealtimeService : IStatisticsRealtimeService
{
    public const string UpdatedEventName = "StatisticsUpdated";

    private readonly IHubContext<StatisticsHub> _hubContext;
    private readonly IServiceScopeFactory _scopeFactory;

    public StatisticsRealtimeService(
        IHubContext<StatisticsHub> hubContext,
        IServiceScopeFactory scopeFactory)
    {
        _hubContext = hubContext;
        _scopeFactory = scopeFactory;
    }

    public async Task NotifyStatisticsUpdatedAsync(CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var statisticsService = scope.ServiceProvider.GetRequiredService<IHomeStatisticsService>();
        var statistics = await statisticsService.GetStatisticsAsync(cancellationToken);

        try
        {
            await _hubContext.Clients.All.SendAsync(UpdatedEventName, statistics, cancellationToken);
        }
        catch
        {
            /* hub delivery must not break callers */
        }
    }
}
