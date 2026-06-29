using CairoBags.Dto.Store;

namespace CairoBags.Service;

public interface IStoreUpdateBroadcastService
{
    Task BroadcastStorefrontAsync(
        string eventName,
        StoreUpdatePayloadDto payload,
        CancellationToken cancellationToken = default);
}
