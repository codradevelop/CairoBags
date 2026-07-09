using CairoBags.Dto.Marketing;

namespace CairoBags.Service;

public interface INewsletterService
{
    Task<ServiceResult<SubscribeNewsletterResponse>> SubscribeAsync(
        SubscribeNewsletterRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<UnsubscribeNewsletterResponse>> UnsubscribeAsync(
        string token,
        CancellationToken cancellationToken = default);

    Task<NewsletterMeResponse> GetSubscriptionStatusAsync(
        string? email,
        CancellationToken cancellationToken = default);

    Task EnqueueProductLaunchEmailsAsync(int productId, CancellationToken cancellationToken = default);

    Task<NewsletterStatsDto> GetStatsAsync(CancellationToken cancellationToken = default);

    Task<PagedNewsletterSubscribersDto> GetSubscribersAsync(
        AdminNewsletterFilterDto filter,
        CancellationToken cancellationToken = default);

    Task<byte[]> ExportSubscribersCsvAsync(
        AdminNewsletterFilterDto filter,
        CancellationToken cancellationToken = default);

    Task<byte[]> ExportSubscribersExcelAsync(
        AdminNewsletterFilterDto filter,
        CancellationToken cancellationToken = default);
}
