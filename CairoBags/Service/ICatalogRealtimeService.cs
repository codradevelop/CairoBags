namespace CairoBags.Service;

public interface ICatalogRealtimeService
{
    Task NotifyProductChangedAsync(
        string action,
        int productId,
        int? categoryId = null,
        CancellationToken cancellationToken = default);

    Task NotifyCategoryChangedAsync(
        string action,
        int categoryId,
        CancellationToken cancellationToken = default);
}
