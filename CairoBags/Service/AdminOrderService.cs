using CairoBags.Data;
using CairoBags.Dto.Orders;
using CairoBags.Models;
using CairoBags.Models.Inventories;
using CairoBags.Models.Orders;
using CairoBags.Models.Payments;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class AdminOrderService : IAdminOrderService
{
    private static readonly OrderStatus[] AdminCancellableOrderStatuses =
    {
        OrderStatus.Pending,
        OrderStatus.AwaitingPayment,
        OrderStatus.PaymentProofSubmitted,
        OrderStatus.PaymentConfirmed,
        OrderStatus.Processing
    };

    private readonly CairoBagsContext _context;
    private readonly NotificationService _notificationService;
    private readonly AuditLogService _auditLogService;

    public AdminOrderService(
        CairoBagsContext context,
        NotificationService notificationService,
        AuditLogService auditLogService)
    {
        _context = context;
        _notificationService = notificationService;
        _auditLogService = auditLogService;
    }

    public async Task<IReadOnlyList<AdminOrderListItemDto>> GetOrdersAsync(
        AdminOrderFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Orders
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.OrderNumber))
        {
            var orderNumber = filter.OrderNumber.Trim();
            query = query.Where(o => o.OrderNumber.Contains(orderNumber));
        }

        if (!string.IsNullOrWhiteSpace(filter.OrderStatus) &&
            Enum.TryParse<OrderStatus>(filter.OrderStatus, true, out var orderStatus))
        {
            query = query.Where(o => o.Status == orderStatus);
        }

        if (!string.IsNullOrWhiteSpace(filter.PaymentStatus) &&
            Enum.TryParse<PaymentStatus>(filter.PaymentStatus, true, out var paymentStatus))
        {
            query = query.Where(o => o.Payment != null && o.Payment.Status == paymentStatus);
        }

        if (filter.StartDate.HasValue)
        {
            var start = filter.StartDate.Value.Date;
            query = query.Where(o => o.CreatedAt >= start);
        }

        if (filter.EndDate.HasValue)
        {
            var endExclusive = filter.EndDate.Value.Date.AddDays(1);
            query = query.Where(o => o.CreatedAt < endExclusive);
        }

        return await query
            .OrderByDescending(o => o.CreatedAt)
            .ThenByDescending(o => o.Id)
            .Select(o => new AdminOrderListItemDto
            {
                OrderId = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerName = o.ShippingFullName,
                CustomerEmail = o.User != null ? o.User.Email : null,
                OrderStatus = o.Status.ToString(),
                PaymentStatus = o.Payment != null ? o.Payment.Status.ToString() : null,
                PaymentMethod = o.Payment != null ? o.Payment.PaymentMethod.Type.ToString() : null,
                TotalAmount = o.TotalAmount,
                ShippingFee = o.ShippingFee,
                ShippingGovernorate = o.ShippingGovernorate,
                ItemsCount = o.Items.Count,
                CreatedAt = o.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<ServiceResult<AdminOrderDetailDto>> GetOrderByIdAsync(
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var order = await LoadOrderDetailQuery()
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null)
        {
            return ServiceResult<AdminOrderDetailDto>.Fail(
                "order_not_found",
                "Order not found.",
                StatusCodes.Status404NotFound);
        }

        return ServiceResult<AdminOrderDetailDto>.Ok(
            await MapOrderDetailAsync(order, cancellationToken));
    }

    public Task<ServiceResult<AdminOrderActionResponseDto>> MoveToProcessingAsync(
        int orderId,
        string adminUserId,
        CancellationToken cancellationToken = default) =>
        TransitionOrderAsync(
            orderId,
            adminUserId,
            validate: order =>
            {
                if (order.Status == OrderStatus.Pending)
                    return null;

                if (order.Status == OrderStatus.AwaitingPayment)
                {
                    if (order.Payment?.Status == PaymentStatus.Confirmed)
                        return null;

                    return new ServiceError(
                        "payment_not_confirmed",
                        "Order can only move to processing when payment is confirmed.");
                }

                return new ServiceError(
                    "invalid_status_transition",
                    $"Cannot move order from {order.Status} to Processing.");
            },
            OrderStatus.Processing,
            "Order moved to processing.",
            NotificationType.OrderProcessing,
            "Preparing Your Order",
            cancellationToken,
            "Your order is now being prepared.");

    public async Task<ServiceResult<AdminOrderActionResponseDto>> MoveToShippedAsync(
        int orderId,
        string adminUserId,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .Include(o => o.Payment!)
                    .ThenInclude(p => p.PaymentMethod)
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

            if (order == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    "order_not_found",
                    "Order not found.",
                    StatusCodes.Status404NotFound);
            }

            if (order.Status != OrderStatus.Processing)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    "invalid_status_transition",
                    $"Cannot move order from {order.Status} to Shipped.");
            }

            var saleResult = await ConvertReservationsToSaleAsync(order, adminUserId, cancellationToken);
            if (saleResult != null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    saleResult.ErrorCode,
                    saleResult.Message,
                    saleResult.StatusCode);
            }

            var now = DateTime.UtcNow;
            var oldStatus = order.Status;

            order.Status = OrderStatus.Shipped;
            order.UpdatedAt = now;
            order.UpdatedBy = adminUserId;
            order.StatusHistory.Add(new OrderStatusHistory
            {
                OldStatus = oldStatus,
                NewStatus = OrderStatus.Shipped,
                Notes = "Order shipped.",
                CreatedAt = now,
                CreatedBy = adminUserId
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _notificationService.TryCreateAndNotifyAsync(
                order.UserId,
                "Your Order Has Been Shipped",
                "Track your delivery soon.",
                NotificationType.OrderShipped,
                NotificationTargetTypes.Order,
                order.Id,
                order.OrderNumber,
                cancellationToken);

            if (IsCashOnDelivery(order))
            {
                await _auditLogService.TryLogOrderStatusChangeAsync(
                    adminUserId,
                    order.Id,
                    order.OrderNumber,
                    oldStatus.ToString(),
                    OrderStatus.Shipped.ToString(),
                    cancellationToken);
            }

            return ServiceResult<AdminOrderActionResponseDto>.Ok(MapActionResponse(order));
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ServiceResult<AdminOrderActionResponseDto>.Fail(
                "concurrency_conflict",
                "Inventory was updated during shipment. Please try again.",
                StatusCodes.Status409Conflict);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public Task<ServiceResult<AdminOrderActionResponseDto>> MoveToDeliveredAsync(
        int orderId,
        string adminUserId,
        CancellationToken cancellationToken = default) =>
        TransitionOrderAsync(
            orderId,
            adminUserId,
            validate: order =>
                order.Status == OrderStatus.Shipped
                    ? null
                    : new ServiceError(
                        "invalid_status_transition",
                        $"Cannot move order from {order.Status} to Delivered."),
            OrderStatus.Delivered,
            "Order delivered.",
            NotificationType.OrderDelivered,
            "Order Delivered",
            cancellationToken,
            "Your order has been delivered successfully.");

    public async Task<ServiceResult<AdminCancelOrderResponseDto>> CancelOrderAsync(
        int orderId,
        string adminUserId,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .Include(o => o.Payment!)
                    .ThenInclude(p => p.PaymentMethod)
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

            if (order == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminCancelOrderResponseDto>.Fail(
                    "order_not_found",
                    "Order not found.",
                    StatusCodes.Status404NotFound);
            }

            if (IsCashOnDelivery(order))
            {
                if (!CodOrderStatusMappings.CanCancel(order.Status))
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return ServiceResult<AdminCancelOrderResponseDto>.Fail(
                        "cancellation_not_allowed",
                        "This order cannot be cancelled in its current status.");
                }
            }
            else if (!AdminCancellableOrderStatuses.Contains(order.Status))
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminCancelOrderResponseDto>.Fail(
                    "cancellation_not_allowed",
                    "This order cannot be cancelled in its current status.");
            }

            var releasedItems = await ReleaseReservationsAsync(
                order,
                adminUserId,
                $"Released reservation for admin-cancelled order {order.OrderNumber}",
                cancellationToken);

            if (releasedItems.Error != null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminCancelOrderResponseDto>.Fail(
                    releasedItems.Error.ErrorCode,
                    releasedItems.Error.Message,
                    releasedItems.Error.StatusCode);
            }

            var now = DateTime.UtcNow;
            var oldStatus = order.Status;

            order.Status = OrderStatus.Cancelled;
            order.UpdatedAt = now;
            order.UpdatedBy = adminUserId;
            order.StatusHistory.Add(new OrderStatusHistory
            {
                OldStatus = oldStatus,
                NewStatus = OrderStatus.Cancelled,
                Notes = "Order cancelled by admin.",
                CreatedAt = now,
                CreatedBy = adminUserId
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _notificationService.TryCreateAndNotifyAsync(
                order.UserId,
                "Order Cancelled",
                "Unfortunately your order has been cancelled.",
                NotificationType.OrderCancelled,
                NotificationTargetTypes.Order,
                order.Id,
                order.OrderNumber,
                cancellationToken);

            if (IsCashOnDelivery(order))
            {
                await _auditLogService.TryLogOrderStatusChangeAsync(
                    adminUserId,
                    order.Id,
                    order.OrderNumber,
                    oldStatus.ToString(),
                    OrderStatus.Cancelled.ToString(),
                    cancellationToken);
            }

            var summary = MapActionResponse(order);
            return ServiceResult<AdminCancelOrderResponseDto>.Ok(new AdminCancelOrderResponseDto
            {
                OrderId = summary.OrderId,
                OrderNumber = summary.OrderNumber,
                CustomerName = summary.CustomerName,
                CustomerEmail = summary.CustomerEmail,
                OrderStatus = summary.OrderStatus,
                PaymentStatus = summary.PaymentStatus,
                TotalAmount = summary.TotalAmount,
                ItemsCount = summary.ItemsCount,
                CreatedAt = summary.CreatedAt,
                ReleasedInventory = releasedItems.Items!
            });
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ServiceResult<AdminCancelOrderResponseDto>.Fail(
                "concurrency_conflict",
                "Inventory was updated during cancellation. Please try again.",
                StatusCodes.Status409Conflict);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ServiceResult<AdminRefundOrderResponseDto>> RefundOrderAsync(
        int orderId,
        string adminUserId,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .Include(o => o.Payment!)
                    .ThenInclude(p => p.PaymentMethod)
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

            if (order == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminRefundOrderResponseDto>.Fail(
                    "order_not_found",
                    "Order not found.",
                    StatusCodes.Status404NotFound);
            }

            if (order.Status != OrderStatus.Delivered)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminRefundOrderResponseDto>.Fail(
                    "refund_not_allowed",
                    "Only delivered orders can be refunded.");
            }

            var variantIds = order.Items.Select(i => i.ProductVariantId).Distinct().ToList();
            var inventories = await _context.Inventories
                .Where(i => variantIds.Contains(i.ProductVariantId))
                .ToDictionaryAsync(i => i.ProductVariantId, cancellationToken);

            var now = DateTime.UtcNow;
            var oldStatus = order.Status;
            var returnedItems = new List<ReturnedInventoryItemDto>();

            foreach (var item in order.Items)
            {
                if (!inventories.TryGetValue(item.ProductVariantId, out var inventory))
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return ServiceResult<AdminRefundOrderResponseDto>.Fail(
                        "inventory_not_found",
                        $"Inventory not found for variant {item.ProductVariantId}.");
                }

                inventory.QuantityOnHand += item.Quantity;
                inventory.UpdatedAt = now;
                inventory.UpdatedBy = adminUserId;

                inventory.Movements.Add(new InventoryMovement
                {
                    Type = InventoryMovementType.Return,
                    Quantity = item.Quantity,
                    Notes = $"Inventory returned from refunded order {order.OrderNumber}",
                    ReferenceNumber = order.OrderNumber,
                    CreatedAt = now,
                    CreatedBy = adminUserId
                });

                returnedItems.Add(new ReturnedInventoryItemDto
                {
                    ProductVariantId = item.ProductVariantId,
                    Sku = item.Sku,
                    QuantityReturned = item.Quantity
                });
            }

            order.Status = OrderStatus.Refunded;
            order.UpdatedAt = now;
            order.UpdatedBy = adminUserId;
            order.StatusHistory.Add(new OrderStatusHistory
            {
                OldStatus = oldStatus,
                NewStatus = OrderStatus.Refunded,
                Notes = "Order refunded by admin.",
                CreatedAt = now,
                CreatedBy = adminUserId
            });

            if (order.Payment != null)
            {
                order.Payment.Status = PaymentStatus.Refunded;
                order.Payment.UpdatedAt = now;
                order.Payment.UpdatedBy = adminUserId;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _notificationService.TryCreateAndNotifyAsync(
                order.UserId,
                "Payment refunded",
                $"Your order {order.OrderNumber} has been refunded.",
                NotificationType.PaymentRefunded,
                NotificationTargetTypes.OrderPayment,
                order.Id,
                order.OrderNumber,
                cancellationToken);

            var summary = MapActionResponse(order);
            return ServiceResult<AdminRefundOrderResponseDto>.Ok(new AdminRefundOrderResponseDto
            {
                OrderId = summary.OrderId,
                OrderNumber = summary.OrderNumber,
                CustomerName = summary.CustomerName,
                CustomerEmail = summary.CustomerEmail,
                OrderStatus = summary.OrderStatus,
                PaymentStatus = summary.PaymentStatus,
                TotalAmount = summary.TotalAmount,
                ItemsCount = summary.ItemsCount,
                CreatedAt = summary.CreatedAt,
                ReturnedInventory = returnedItems
            });
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ServiceResult<AdminRefundOrderResponseDto>.Fail(
                "concurrency_conflict",
                "Inventory was updated during refund. Please try again.",
                StatusCodes.Status409Conflict);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ServiceResult<AdminOrderActionResponseDto>> UpdateCodOrderStatusAsync(
        int orderId,
        string targetStatusRaw,
        string adminUserId,
        CancellationToken cancellationToken = default)
    {
        if (!CodOrderStatusMappings.TryParseTargetStatus(targetStatusRaw, out var targetStatus))
        {
            return ServiceResult<AdminOrderActionResponseDto>.Fail(
                "invalid_status",
                "Invalid order status.",
                StatusCodes.Status400BadRequest);
        }

        var order = await _context.Orders
            .Include(o => o.Payment!)
                .ThenInclude(p => p.PaymentMethod)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null)
        {
            return ServiceResult<AdminOrderActionResponseDto>.Fail(
                "order_not_found",
                "Order not found.",
                StatusCodes.Status404NotFound);
        }

        if (!IsCashOnDelivery(order))
        {
            return ServiceResult<AdminOrderActionResponseDto>.Fail(
                "not_cod_order",
                "Status updates through this action are only available for Cash on Delivery orders.");
        }

        if (order.Status == targetStatus)
        {
            return ServiceResult<AdminOrderActionResponseDto>.Fail(
                "status_unchanged",
                "The order is already in the selected status.");
        }

        if (!CodOrderStatusMappings.CanTransition(order.Status, targetStatus))
        {
            return ServiceResult<AdminOrderActionResponseDto>.Fail(
                "invalid_status_transition",
                $"Cannot move order from {order.Status} to {targetStatus}.");
        }

        if (targetStatus == OrderStatus.Cancelled)
        {
            return MapCancelToActionResponse(await CancelOrderAsync(orderId, adminUserId, cancellationToken));
        }

        if (targetStatus == OrderStatus.HandedToShipping)
        {
            return await TransitionCodToHandedToShippingAsync(orderId, adminUserId, cancellationToken);
        }

        var copy = CodOrderStatusMappings.GetTransitionCopy(targetStatus, order.OrderNumber);
        return await TransitionOrderAsync(
            orderId,
            adminUserId,
            validate: current =>
                CodOrderStatusMappings.CanTransition(current.Status, targetStatus)
                    ? null
                    : new ServiceError(
                        "invalid_status_transition",
                        $"Cannot move order from {current.Status} to {targetStatus}."),
            targetStatus,
            copy.HistoryNote,
            CodOrderStatusMappings.GetNotificationType(targetStatus),
            copy.NotificationTitle,
            cancellationToken,
            copy.NotificationMessage);
    }

    private async Task<ServiceResult<AdminOrderActionResponseDto>> TransitionCodToHandedToShippingAsync(
        int orderId,
        string adminUserId,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .Include(o => o.Payment!)
                    .ThenInclude(p => p.PaymentMethod)
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

            if (order == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    "order_not_found",
                    "Order not found.",
                    StatusCodes.Status404NotFound);
            }

            if (!IsCashOnDelivery(order))
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    "not_cod_order",
                    "Status updates through this action are only available for Cash on Delivery orders.");
            }

            if (!CodOrderStatusMappings.CanTransition(order.Status, OrderStatus.HandedToShipping))
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    "invalid_status_transition",
                    $"Cannot move order from {order.Status} to HandedToShipping.");
            }

            var saleResult = await ConvertReservationsToSaleAsync(order, adminUserId, cancellationToken);
            if (saleResult != null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    saleResult.ErrorCode,
                    saleResult.Message,
                    saleResult.StatusCode);
            }

            var now = DateTime.UtcNow;
            var oldStatus = order.Status;
            var copy = CodOrderStatusMappings.GetTransitionCopy(OrderStatus.HandedToShipping, order.OrderNumber);

            order.Status = OrderStatus.HandedToShipping;
            order.UpdatedAt = now;
            order.UpdatedBy = adminUserId;
            order.StatusHistory.Add(new OrderStatusHistory
            {
                OldStatus = oldStatus,
                NewStatus = OrderStatus.HandedToShipping,
                Notes = copy.HistoryNote,
                CreatedAt = now,
                CreatedBy = adminUserId
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _notificationService.TryCreateAndNotifyAsync(
                order.UserId,
                copy.NotificationTitle,
                copy.NotificationMessage,
                CodOrderStatusMappings.GetNotificationType(OrderStatus.HandedToShipping),
                NotificationTargetTypes.Order,
                order.Id,
                order.OrderNumber,
                cancellationToken);

            await _auditLogService.TryLogOrderStatusChangeAsync(
                adminUserId,
                order.Id,
                order.OrderNumber,
                oldStatus.ToString(),
                OrderStatus.HandedToShipping.ToString(),
                cancellationToken);

            return ServiceResult<AdminOrderActionResponseDto>.Ok(MapActionResponse(order));
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ServiceResult<AdminOrderActionResponseDto>.Fail(
                "concurrency_conflict",
                "Inventory was updated during shipment. Please try again.",
                StatusCodes.Status409Conflict);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static ServiceResult<AdminOrderActionResponseDto> MapCancelToActionResponse(
        ServiceResult<AdminCancelOrderResponseDto> result)
    {
        if (!result.Succeeded || result.Data == null)
        {
            return ServiceResult<AdminOrderActionResponseDto>.Fail(
                result.ErrorCode ?? "cancellation_failed",
                result.Message ?? "Failed to cancel order.",
                result.StatusCode ?? StatusCodes.Status400BadRequest);
        }

        var data = result.Data;
        return ServiceResult<AdminOrderActionResponseDto>.Ok(new AdminOrderActionResponseDto
        {
            OrderId = data.OrderId,
            OrderNumber = data.OrderNumber,
            CustomerName = data.CustomerName,
            CustomerEmail = data.CustomerEmail,
            OrderStatus = data.OrderStatus,
            PaymentStatus = data.PaymentStatus,
            TotalAmount = data.TotalAmount,
            ItemsCount = data.ItemsCount,
            CreatedAt = data.CreatedAt
        });
    }

    private static bool IsCashOnDelivery(Order order) =>
        order.Payment?.PaymentMethod?.Type == PaymentMethodType.CashOnDelivery;

    private async Task<ServiceResult<AdminOrderActionResponseDto>> TransitionOrderAsync(
        int orderId,
        string adminUserId,
        Func<Order, ServiceError?> validate,
        OrderStatus newStatus,
        string historyNote,
        NotificationType notificationType,
        string notificationTitle,
        CancellationToken cancellationToken,
        string? notificationMessage = null)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .Include(o => o.Payment!)
                    .ThenInclude(p => p.PaymentMethod)
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

            if (order == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    "order_not_found",
                    "Order not found.",
                    StatusCodes.Status404NotFound);
            }

            var validationError = validate(order);
            if (validationError != null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    validationError.ErrorCode,
                    validationError.Message,
                    validationError.StatusCode);
            }

            var now = DateTime.UtcNow;
            var oldStatus = order.Status;

            order.Status = newStatus;
            order.UpdatedAt = now;
            order.UpdatedBy = adminUserId;
            order.StatusHistory.Add(new OrderStatusHistory
            {
                OldStatus = oldStatus,
                NewStatus = newStatus,
                Notes = historyNote,
                CreatedAt = now,
                CreatedBy = adminUserId
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var message = notificationMessage ?? newStatus switch
            {
                OrderStatus.PaymentConfirmed => $"Your order {order.OrderNumber} has been confirmed.",
                OrderStatus.Processing => $"Your order {order.OrderNumber} is now being prepared.",
                OrderStatus.Shipped => "Track your delivery soon.",
                OrderStatus.Delivered => "Your order has been delivered successfully.",
                _ => $"Your order {order.OrderNumber} status has been updated."
            };

            await _notificationService.TryCreateAndNotifyAsync(
                order.UserId,
                notificationTitle,
                message,
                notificationType,
                NotificationTargetTypes.Order,
                order.Id,
                order.OrderNumber,
                cancellationToken);

            if (IsCashOnDelivery(order))
            {
                await _auditLogService.TryLogOrderStatusChangeAsync(
                    adminUserId,
                    order.Id,
                    order.OrderNumber,
                    oldStatus.ToString(),
                    newStatus.ToString(),
                    cancellationToken);
            }

            return ServiceResult<AdminOrderActionResponseDto>.Ok(MapActionResponse(order));
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<(List<ReleasedInventoryItemDto>? Items, ServiceError? Error)> ReleaseReservationsAsync(
        Order order,
        string userId,
        string movementNotes,
        CancellationToken cancellationToken)
    {
        var variantIds = order.Items.Select(i => i.ProductVariantId).Distinct().ToList();
        var inventories = await _context.Inventories
            .Where(i => variantIds.Contains(i.ProductVariantId))
            .ToDictionaryAsync(i => i.ProductVariantId, cancellationToken);

        var now = DateTime.UtcNow;
        var releasedItems = new List<ReleasedInventoryItemDto>();

        foreach (var item in order.Items)
        {
            if (!inventories.TryGetValue(item.ProductVariantId, out var inventory))
            {
                return (null, new ServiceError(
                    "inventory_not_found",
                    $"Inventory not found for variant {item.ProductVariantId}."));
            }

            if (item.Quantity > inventory.QuantityReserved)
            {
                return (null, new ServiceError(
                    "invalid_release",
                    $"Cannot release more than reserved quantity for SKU {item.Sku}."));
            }

            inventory.QuantityReserved -= item.Quantity;
            inventory.UpdatedAt = now;
            inventory.UpdatedBy = userId;

            inventory.Movements.Add(new InventoryMovement
            {
                Type = InventoryMovementType.ReleaseReservation,
                Quantity = item.Quantity,
                Notes = movementNotes,
                ReferenceNumber = order.OrderNumber,
                CreatedAt = now,
                CreatedBy = userId
            });

            releasedItems.Add(new ReleasedInventoryItemDto
            {
                ProductVariantId = item.ProductVariantId,
                Sku = item.Sku,
                QuantityReleased = item.Quantity
            });
        }

        return (releasedItems, null);
    }

    private async Task<ServiceError?> ConvertReservationsToSaleAsync(
        Order order,
        string userId,
        CancellationToken cancellationToken)
    {
        var variantIds = order.Items.Select(i => i.ProductVariantId).Distinct().ToList();
        var inventories = await _context.Inventories
            .Where(i => variantIds.Contains(i.ProductVariantId))
            .ToDictionaryAsync(i => i.ProductVariantId, cancellationToken);

        var now = DateTime.UtcNow;

        foreach (var item in order.Items)
        {
            if (!inventories.TryGetValue(item.ProductVariantId, out var inventory))
            {
                return new ServiceError(
                    "inventory_not_found",
                    $"Inventory not found for variant {item.ProductVariantId}.");
            }

            if (item.Quantity > inventory.QuantityReserved)
            {
                return new ServiceError(
                    "inventory_state_invalid",
                    $"Insufficient reserved quantity for SKU {item.Sku}.",
                    StatusCodes.Status409Conflict);
            }

            inventory.QuantityReserved -= item.Quantity;
            inventory.QuantityOnHand -= item.Quantity;
            inventory.UpdatedAt = now;
            inventory.UpdatedBy = userId;

            inventory.Movements.Add(new InventoryMovement
            {
                Type = InventoryMovementType.Sale,
                Quantity = item.Quantity,
                Notes = $"Inventory sold for order {order.OrderNumber}",
                ReferenceNumber = order.OrderNumber,
                CreatedAt = now,
                CreatedBy = userId
            });
        }

        return null;
    }

    private IQueryable<Order> LoadOrderDetailQuery() =>
        _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
            .Include(o => o.Payment!)
                .ThenInclude(p => p.PaymentMethod)
            .Include(o => o.StatusHistory);

    private static AdminOrderListItemDto MapListItem(Order order) =>
        new()
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerName = order.ShippingFullName,
            CustomerEmail = order.User?.Email,
            OrderStatus = order.Status.ToString(),
            PaymentStatus = order.Payment?.Status.ToString(),
            TotalAmount = order.TotalAmount,
            ShippingFee = order.ShippingFee,
            ShippingGovernorate = order.ShippingGovernorate,
            ItemsCount = order.Items.Count,
            CreatedAt = order.CreatedAt
        };

    private static AdminOrderActionResponseDto MapActionResponse(Order order) =>
        new()
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerName = order.ShippingFullName,
            CustomerEmail = order.User?.Email,
            OrderStatus = order.Status.ToString(),
            PaymentStatus = order.Payment?.Status.ToString(),
            TotalAmount = order.TotalAmount,
            ItemsCount = order.Items.Count,
            CreatedAt = order.CreatedAt
        };

    private static AdminOrderDetailDto MapOrderDetail(
        Order order,
        IReadOnlyDictionary<string, string> changedByNames) =>
        new()
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerName = order.ShippingFullName,
            CustomerEmail = order.User?.Email,
            CustomerPhone = order.ShippingPhoneNumber,
            UserId = order.UserId,
            OrderStatus = order.Status.ToString(),
            PaymentStatus = order.Payment?.Status.ToString(),
            TotalAmount = order.TotalAmount,
            ItemsCount = order.Items.Count,
            CreatedAt = order.CreatedAt,
            Order = new OrderInformationDto
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                CreatedAt = order.CreatedAt,
                OrderStatus = order.Status.ToString(),
                SubTotal = order.SubTotal,
                ShippingFee = order.ShippingFee,
                DiscountAmount = order.DiscountAmount,
                TotalAmount = order.TotalAmount,
                CurrencyCode = order.CurrencyCode,
                Notes = order.Notes
            },
            ShippingAddress = new OrderShippingAddressDto
            {
                FullName = order.ShippingFullName,
                PhoneNumber = order.ShippingPhoneNumber,
                Governorate = order.ShippingGovernorate,
                City = order.ShippingCity,
                AddressLine1 = order.ShippingAddressLine1,
                AddressLine2 = order.ShippingAddressLine2,
                PostalCode = order.ShippingPostalCode
            },
            Payment = order.Payment == null
                ? null
                : new OrderPaymentInfoDto
                {
                    PaymentId = order.Payment.Id,
                    PaymentMethod = order.Payment.PaymentMethod.Type.ToString(),
                    PaymentStatus = order.Payment.Status.ToString(),
                    Amount = order.Payment.Amount,
                    SenderName = order.Payment.SenderName,
                    SenderPhone = order.Payment.SenderPhone,
                    TransactionReference = order.Payment.TransactionReference
                },
            Items = order.Items
                .OrderBy(i => i.Id)
                .Select(item => new OrderItemDto
                {
                    OrderItemId = item.Id,
                    ProductId = item.ProductId,
                    ProductVariantId = item.ProductVariantId,
                    ProductNameAr = item.ProductNameAr,
                    ProductNameEn = item.ProductNameEn,
                    ColorNameAr = item.ColorNameAr,
                    ColorNameEn = item.ColorNameEn,
                    Sku = item.Sku,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    LineTotal = item.UnitPrice * item.Quantity,
                    ImageUrl = item.ImageUrl
                })
                .ToList(),
            Coupon = string.IsNullOrWhiteSpace(order.CouponCode)
                ? null
                : new OrderCouponInfoDto
                {
                    Code = order.CouponCode,
                    DiscountAmount = order.CouponDiscount ?? order.DiscountAmount
                },
            StatusHistory = order.StatusHistory
                .OrderBy(h => h.CreatedAt)
                .ThenBy(h => h.Id)
                .Select(h => new OrderStatusHistoryDto
                {
                    OldStatus = h.OldStatus?.ToString(),
                    NewStatus = h.NewStatus.ToString(),
                    Notes = h.Notes,
                    CreatedAt = h.CreatedAt,
                    ChangedByName = h.CreatedBy != null && changedByNames.TryGetValue(h.CreatedBy, out var name)
                        ? name
                        : null,
                })
                .ToList()
        };

    private async Task<AdminOrderDetailDto> MapOrderDetailAsync(
        Order order,
        CancellationToken cancellationToken)
    {
        var userIds = order.StatusHistory
            .Select(h => h.CreatedBy)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();

        var changedByNames = userIds.Count == 0
            ? new Dictionary<string, string>()
            : await _context.Users
                .AsNoTracking()
                .Include(u => u.CustomerProfile)
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(
                    u => u.Id,
                    u =>
                    {
                        var displayName = u.CustomerProfile?.DisplayName;
                        if (!string.IsNullOrWhiteSpace(displayName))
                            return displayName;

                        var combined = $"{u.CustomerProfile?.FirstName} {u.CustomerProfile?.LastName}".Trim();
                        if (!string.IsNullOrWhiteSpace(combined))
                            return combined;

                        return u.UserName ?? u.Email ?? "Admin";
                    },
                    cancellationToken);

        return MapOrderDetail(order, changedByNames);
    }

    private sealed record ServiceError(string ErrorCode, string Message, int StatusCode = StatusCodes.Status400BadRequest);
}
