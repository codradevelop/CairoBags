namespace CairoBags.Service;

public interface IStatisticsRealtimeService
{
    Task NotifyStatisticsUpdatedAsync(CancellationToken cancellationToken = default);
}
