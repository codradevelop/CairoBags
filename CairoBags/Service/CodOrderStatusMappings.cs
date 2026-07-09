using CairoBags.Models;
using CairoBags.Models.Orders;

namespace CairoBags.Service;

/// <summary>Maps and validates Cash on Delivery order status transitions.</summary>
public static class CodOrderStatusMappings
{
  public static readonly OrderStatus[] CancellableStatuses =
  {
    OrderStatus.Pending,
    OrderStatus.Confirmed,
    OrderStatus.Preparing,
    OrderStatus.HandedToShipping,
    // Legacy COD rows still stored with wallet-era status names.
    OrderStatus.PaymentConfirmed,
    OrderStatus.Processing,
    OrderStatus.Shipped,
    // Legacy step removed from active flow.
    OrderStatus.AtLocalHub,
  };

  private static readonly IReadOnlyDictionary<OrderStatus, OrderStatus> NextStatus = new Dictionary<OrderStatus, OrderStatus>
  {
    [OrderStatus.Pending] = OrderStatus.Confirmed,
    [OrderStatus.Confirmed] = OrderStatus.Preparing,
    [OrderStatus.Preparing] = OrderStatus.HandedToShipping,
    [OrderStatus.HandedToShipping] = OrderStatus.OutForDelivery,
    [OrderStatus.OutForDelivery] = OrderStatus.Delivered,
    // Legacy rows already at AtLocalHub can still advance.
    [OrderStatus.AtLocalHub] = OrderStatus.OutForDelivery,
  };

  private static readonly IReadOnlyDictionary<string, OrderStatus> LegacyAliases = new Dictionary<string, OrderStatus>(StringComparer.OrdinalIgnoreCase)
  {
    ["PaymentConfirmed"] = OrderStatus.Confirmed,
    ["Processing"] = OrderStatus.Preparing,
    ["Shipped"] = OrderStatus.OutForDelivery,
  };

  public static bool TryParseTargetStatus(string? raw, out OrderStatus status)
  {
    status = default;
    if (string.IsNullOrWhiteSpace(raw))
      return false;

    var trimmed = raw.Trim();
    if (LegacyAliases.TryGetValue(trimmed, out status))
      return true;

    return Enum.TryParse(trimmed, true, out status) && IsCodTargetStatus(status);
  }

  public static bool IsCodTargetStatus(OrderStatus status) =>
    status is OrderStatus.Confirmed
      or OrderStatus.Preparing
      or OrderStatus.HandedToShipping
      or OrderStatus.OutForDelivery
      or OrderStatus.Delivered
      or OrderStatus.Cancelled;

  public static OrderStatus Normalize(OrderStatus status) =>
    status switch
    {
      OrderStatus.PaymentConfirmed => OrderStatus.Confirmed,
      OrderStatus.Processing => OrderStatus.Preparing,
      OrderStatus.Shipped => OrderStatus.OutForDelivery,
      _ => status,
    };

  public static bool CanCancel(OrderStatus status) => CancellableStatuses.Contains(status);

  public static bool CanTransition(OrderStatus current, OrderStatus target)
  {
    if (target == OrderStatus.Cancelled)
      return CanCancel(current);

    var normalizedCurrent = Normalize(current);

    if (target == OrderStatus.Delivered && current == OrderStatus.Shipped)
      return true;

    return NextStatus.TryGetValue(normalizedCurrent, out var next) && next == target;
  }

  public static (string HistoryNote, string NotificationTitle, string NotificationMessage) GetTransitionCopy(
    OrderStatus targetStatus,
    string orderNumber) =>
    targetStatus switch
    {
      OrderStatus.Confirmed => (
        "Order confirmed.",
        "Order Confirmed",
        $"Your order {orderNumber} has been confirmed."),
      OrderStatus.Preparing => (
        "Order is being prepared.",
        "Preparing Your Order",
        $"Your order {orderNumber} is now being prepared."),
      OrderStatus.HandedToShipping => (
        "Order handed to shipping.",
        "Order Handed to Shipping",
        $"Your order {orderNumber} has been handed to shipping."),
      OrderStatus.AtLocalHub => (
        "Order arrived at local hub.",
        "At Local Hub",
        $"Your order {orderNumber} has arrived at the local hub."),
      OrderStatus.OutForDelivery => (
        "Order is out for delivery.",
        "Out for Delivery",
        $"Your order {orderNumber} is out for delivery."),
      OrderStatus.Delivered => (
        "Order delivered.",
        "Order Delivered",
        "Your order has been delivered successfully."),
      _ => (
        "Order status updated.",
        "Order Update",
        $"Your order {orderNumber} status has been updated."),
    };

  public static NotificationType GetNotificationType(OrderStatus targetStatus) =>
    targetStatus switch
    {
      OrderStatus.Confirmed => NotificationType.OrderConfirmed,
      OrderStatus.Preparing => NotificationType.OrderProcessing,
      OrderStatus.HandedToShipping => NotificationType.OrderShipped,
      OrderStatus.AtLocalHub => NotificationType.OrderShipped,
      OrderStatus.OutForDelivery => NotificationType.OrderShipped,
      OrderStatus.Delivered => NotificationType.OrderDelivered,
      _ => NotificationType.OrderConfirmed,
    };
}
