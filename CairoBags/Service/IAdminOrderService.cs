using CairoBags.Dto.Orders;

namespace CairoBags.Service;

public interface IAdminOrderService
{
    Task<IReadOnlyList<AdminOrderListItemDto>> GetOrdersAsync(
        AdminOrderFilterDto filter,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminOrderDetailDto>> GetOrderByIdAsync(
        int orderId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminOrderActionResponseDto>> MoveToProcessingAsync(
        int orderId,
        string adminUserId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminOrderActionResponseDto>> MoveToShippedAsync(
        int orderId,
        string adminUserId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminOrderActionResponseDto>> MoveToDeliveredAsync(
        int orderId,
        string adminUserId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminCancelOrderResponseDto>> CancelOrderAsync(
        int orderId,
        string adminUserId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminRefundOrderResponseDto>> RefundOrderAsync(
        int orderId,
        string adminUserId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminOrderActionResponseDto>> UpdateCodOrderStatusAsync(
        int orderId,
        string targetStatus,
        string adminUserId,
        CancellationToken cancellationToken = default);
}
