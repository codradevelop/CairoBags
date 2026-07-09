using CairoBags.Dto.Store;
using CairoBags.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace CairoBags.Service;

/// <summary>
/// Fire-and-forget storefront broadcasts after successful database commits.
/// Failures are swallowed so realtime never blocks business operations.
/// </summary>
public class StoreUpdateBroadcastService : IStoreUpdateBroadcastService
{
    private readonly IHubContext<StoreUpdateHub> _hubContext;

    public StoreUpdateBroadcastService(IHubContext<StoreUpdateHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task BroadcastStorefrontAsync(
        string eventName,
        StoreUpdatePayloadDto payload,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(eventName)) return;

        payload.OccurredAt = DateTime.UtcNow;

        try
        {
            await _hubContext.Clients
                .Group(StoreUpdateGroupNames.Storefront)
                .SendAsync(eventName, payload, cancellationToken);
        }
        catch
        {
            // Realtime is best-effort; REST remains source of truth.
        }

        try
        {
            await _hubContext.Clients
                .Group(StoreUpdateGroupNames.AdminCatalog)
                .SendAsync(eventName, payload, cancellationToken);
        }
        catch
        {
            // Admin catalog refresh is also best-effort.
        }
    }
}
