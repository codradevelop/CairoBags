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
        OrderStatus.Processing
    };

    private readonly CairoBagsContext _context;
    private readonly NotificationService _notificationService;
    private readonly IStatisticsRealtimeService _statisticsRealtime;

    public AdminOrderService(
        CairoBagsContext context,
        NotificationService notificationService,
        IStatisticsRealtimeService statisticsRealtime)
    {
        _context = context;
        _notificationService = notificationService;
        _statisticsRealtime = statisticsRealtime;
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
                TotalAmount = o.TotalAmount,
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

        return ServiceResult<AdminOrderDetailDto>.Ok(MapOrderDetail(order));
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
            "Order is being processed",
            cancellationToken);

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
                .Include(o => o.Payment)
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
                "Order shipped",
                $"Your order {order.OrderNumber} has been shipped.",
                NotificationType.OrderShipped,
                NotificationTargetTypes.Order,
                order.Id,
                order.OrderNumber,
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
            "Order delivered",
            cancellationToken);

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
                .Include(o => o.Payment)
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

            if (!AdminCancellableOrderStatuses.Contains(order.Status))
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
                "Order cancelled",
                $"Your order {order.OrderNumber} has been cancelled.",
                NotificationType.OrderCancelled,
                NotificationTargetTypes.Order,
                order.Id,
                order.OrderNumber,
                cancellationToken);

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
                .Include(o => o.Payment)
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
        string targetStatus,
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

            if (order.Payment?.PaymentMethod?.Type != PaymentMethodType.CashOnDelivery)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    "not_cod_order",
                    "This order is not a Cash on Delivery order.",
                    StatusCodes.Status400BadRequest);
            }

            if (!Enum.TryParse<OrderStatus>(targetStatus, true, out var newStatus))
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    "invalid_status",
                    $"Invalid order status: {targetStatus}",
                    StatusCodes.Status400BadRequest);
            }

            var oldStatus = order.Status;
            if (oldStatus == newStatus)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    "no_status_change",
                    "Order is already in the target status.",
                    StatusCodes.Status400BadRequest);
            }

            var codAllowedTransitions = new Dictionary<OrderStatus, OrderStatus[]>
            {
                { OrderStatus.Pending, new[] { OrderStatus.Confirmed, OrderStatus.Cancelled } },
                { OrderStatus.Confirmed, new[] { OrderStatus.Preparing, OrderStatus.Cancelled } },
                { OrderStatus.Preparing, new[] { OrderStatus.HandedToShipping, OrderStatus.Cancelled } },
                { OrderStatus.HandedToShipping, new[] { OrderStatus.AtLocalHub, OrderStatus.OutForDelivery, OrderStatus.Cancelled } },
                { OrderStatus.AtLocalHub, new[] { OrderStatus.OutForDelivery, OrderStatus.Cancelled } },
                { OrderStatus.OutForDelivery, new[] { OrderStatus.Delivered, OrderStatus.Cancelled } }
            };

            bool isAllowed = false;
            if (codAllowedTransitions.TryGetValue(oldStatus, out var allowedTargets))
            {
                isAllowed = allowedTargets.Contains(newStatus);
            }

            if (!isAllowed)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<AdminOrderActionResponseDto>.Fail(
                    "invalid_status_transition",
                    $"Cannot transition COD order from {oldStatus} to {newStatus}.",
                    StatusCodes.Status400BadRequest);
            }

            var now = DateTime.UtcNow;

            // Handle inventory transitions
            bool isNewStatusShippedOrLater = newStatus == OrderStatus.HandedToShipping ||
                                             newStatus == OrderStatus.AtLocalHub ||
                                             newStatus == OrderStatus.OutForDelivery ||
                                             newStatus == OrderStatus.Delivered;

            bool isOldStatusBeforeShipped = oldStatus == OrderStatus.Pending ||
                                            oldStatus == OrderStatus.Confirmed ||
                                            oldStatus == OrderStatus.Preparing;

            if (isNewStatusShippedOrLater && isOldStatusBeforeShipped)
            {
                var saleResult = await ConvertReservationsToSaleAsync(order, adminUserId, cancellationToken);
                if (saleResult != null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return ServiceResult<AdminOrderActionResponseDto>.Fail(
                        saleResult.ErrorCode,
                        saleResult.Message,
                        saleResult.StatusCode);
                }
            }

            if (newStatus == OrderStatus.Cancelled)
            {
                if (isOldStatusBeforeShipped)
                {
                    var releaseResult = await ReleaseReservationsAsync(
                        order,
                        adminUserId,
                        $"Released reservation for cancelled COD order {order.OrderNumber}",
                        cancellationToken);

                    if (releaseResult.Error != null)
                    {
                        await transaction.RollbackAsync(cancellationToken);
                        return ServiceResult<AdminOrderActionResponseDto>.Fail(
                            releaseResult.Error.ErrorCode,
                            releaseResult.Error.Message,
                            releaseResult.Error.StatusCode);
                    }
                }
                else
                {
                    var variantIds = order.Items.Select(i => i.ProductVariantId).Distinct().ToList();
                    var inventories = await _context.Inventories
                        .Where(i => variantIds.Contains(i.ProductVariantId))
                        .ToDictionaryAsync(i => i.ProductVariantId, cancellationToken);

                    foreach (var item in order.Items)
                    {
                        if (!inventories.TryGetValue(item.ProductVariantId, out var inventory))
                        {
                            await transaction.RollbackAsync(cancellationToken);
                            return ServiceResult<AdminOrderActionResponseDto>.Fail(
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
                            Notes = $"Inventory returned from cancelled COD order {order.OrderNumber}",
                            ReferenceNumber = order.OrderNumber,
                            CreatedAt = now,
                            CreatedBy = adminUserId
                        });
                    }
                }
            }

            order.Status = newStatus;
            order.UpdatedAt = now;
            order.UpdatedBy = adminUserId;
            order.StatusHistory.Add(new OrderStatusHistory
            {
                OldStatus = oldStatus,
                NewStatus = newStatus,
                Notes = $"COD status updated to {newStatus} by admin.",
                CreatedAt = now,
                CreatedBy = adminUserId
            });

            if (newStatus == OrderStatus.Delivered && order.Payment != null)
            {
                order.Payment.Status = PaymentStatus.Confirmed;
                order.Payment.UpdatedAt = now;
                order.Payment.UpdatedBy = adminUserId;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var notificationType = newStatus switch
            {
                OrderStatus.Confirmed => NotificationType.OrderConfirmed,
                OrderStatus.Preparing => NotificationType.OrderProcessing,
                OrderStatus.HandedToShipping => NotificationType.OrderShipped,
                OrderStatus.AtLocalHub => NotificationType.OrderShipped,
                OrderStatus.OutForDelivery => NotificationType.OrderShipped,
                OrderStatus.Delivered => NotificationType.OrderDelivered,
                OrderStatus.Cancelled => NotificationType.OrderCancelled,
                _ => NotificationType.OrderProcessing
            };

            var notificationTitle = newStatus switch
            {
                OrderStatus.Confirmed => "Order Confirmed",
                OrderStatus.Preparing => "Order Preparing",
                OrderStatus.HandedToShipping => "Order Handed to Shipping",
                OrderStatus.AtLocalHub => "Order at Local Hub",
                OrderStatus.OutForDelivery => "Order Out for Delivery",
                OrderStatus.Delivered => "Order Delivered",
                OrderStatus.Cancelled => "Order Cancelled",
                _ => "Order Updated"
            };

            var message = newStatus switch
            {
                OrderStatus.Confirmed => $"Your order {order.OrderNumber} has been confirmed.",
                OrderStatus.Preparing => $"Your order {order.OrderNumber} is being prepared.",
                OrderStatus.HandedToShipping => $"Your order {order.OrderNumber} has been handed to shipping.",
                OrderStatus.AtLocalHub => $"Your order {order.OrderNumber} arrived at the local hub.",
                OrderStatus.OutForDelivery => $"Your order {order.OrderNumber} is out for delivery.",
                OrderStatus.Delivered => $"Your order {order.OrderNumber} has been delivered.",
                OrderStatus.Cancelled => $"Your order {order.OrderNumber} has been cancelled.",
                _ => $"Your order {order.OrderNumber} status has been updated to {newStatus}."
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

            if (newStatus is OrderStatus.Delivered or OrderStatus.Completed)
                await _statisticsRealtime.NotifyStatisticsUpdatedAsync(cancellationToken);

            return ServiceResult<AdminOrderActionResponseDto>.Ok(MapActionResponse(order));
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ServiceResult<AdminOrderActionResponseDto>.Fail(
                "concurrency_conflict",
                "Inventory was updated during status update. Please try again.",
                StatusCodes.Status409Conflict);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<ServiceResult<AdminOrderActionResponseDto>> TransitionOrderAsync(
        int orderId,
        string adminUserId,
        Func<Order, ServiceError?> validate,
        OrderStatus newStatus,
        string historyNote,
        NotificationType notificationType,
        string notificationTitle,
        CancellationToken cancellationToken)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .Include(o => o.Payment)
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

            var message = newStatus switch
            {
                OrderStatus.Processing => $"Your order {order.OrderNumber} is now being processed.",
                OrderStatus.Shipped => $"Your order {order.OrderNumber} has been shipped.",
                OrderStatus.Delivered => $"Your order {order.OrderNumber} has been delivered.",
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

            if (newStatus is OrderStatus.Delivered or OrderStatus.Completed)
                await _statisticsRealtime.NotifyStatisticsUpdatedAsync(cancellationToken);

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

    private static AdminOrderDetailDto MapOrderDetail(Order order) =>
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
                    CreatedAt = h.CreatedAt
                })
                .ToList()
        };

    private sealed record ServiceError(string ErrorCode, string Message, int StatusCode = StatusCodes.Status400BadRequest);
}
