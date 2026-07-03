using CairoBags.Dto.Catalog;
using CairoBags.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace CairoBags.Service;

/// <summary>Pushes catalog CRUD events to all connected clients via SignalR.</summary>
public class CatalogRealtimeService : ICatalogRealtimeService
{
    public const string ChangedEventName = "CatalogChanged";

    private readonly IHubContext<CatalogHub> _hubContext;

    public CatalogRealtimeService(IHubContext<CatalogHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task NotifyProductChangedAsync(
        string action,
        int productId,
        int? categoryId = null,
        CancellationToken cancellationToken = default) =>
        BroadcastAsync("product", action, productId, categoryId, cancellationToken);

    public Task NotifyCategoryChangedAsync(
        string action,
        int categoryId,
        CancellationToken cancellationToken = default) =>
        BroadcastAsync("category", action, categoryId, categoryId: null, cancellationToken);

    private async Task BroadcastAsync(
        string entityType,
        string action,
        int id,
        int? categoryId,
        CancellationToken cancellationToken)
    {
        var payload = new CatalogChangeEventDto
        {
            EntityType = entityType,
            Action = action,
            Id = id,
            CategoryId = categoryId
        };

        try
        {
            await _hubContext.Clients.All.SendAsync(ChangedEventName, payload, cancellationToken);
        }
        catch
        {
            /* hub delivery must not break callers */
        }
    }
}
