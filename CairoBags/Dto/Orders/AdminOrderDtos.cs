namespace CairoBags.Dto.Orders;

public class AdminOrderFilterDto
{
    public string? OrderNumber { get; set; }

    public string? OrderStatus { get; set; }

    public string? PaymentStatus { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }
}

public class AdminOrderListItemDto
{
    public int OrderId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;

    public string? CustomerEmail { get; set; }

    public string OrderStatus { get; set; } = string.Empty;

    public string? PaymentStatus { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal ShippingFee { get; set; }

    public string ShippingGovernorate { get; set; } = string.Empty;

    public int ItemsCount { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? PaymentMethod { get; set; }
}

public class AdminOrderDetailDto
{
    public int OrderId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;

    public string? CustomerEmail { get; set; }

    public string? CustomerPhone { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string OrderStatus { get; set; } = string.Empty;

    public string? PaymentStatus { get; set; }

    public decimal TotalAmount { get; set; }

    public int ItemsCount { get; set; }

    public DateTime CreatedAt { get; set; }

    public OrderInformationDto Order { get; set; } = new();

    public OrderShippingAddressDto ShippingAddress { get; set; } = new();

    public OrderPaymentInfoDto? Payment { get; set; }

    public IReadOnlyList<OrderItemDto> Items { get; set; } = Array.Empty<OrderItemDto>();

    public OrderCouponInfoDto? Coupon { get; set; }

    public IReadOnlyList<OrderStatusHistoryDto> StatusHistory { get; set; } = Array.Empty<OrderStatusHistoryDto>();
}

public class AdminOrderActionResponseDto
{
    public int OrderId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;

    public string? CustomerEmail { get; set; }

    public string OrderStatus { get; set; } = string.Empty;

    public string? PaymentStatus { get; set; }

    public decimal TotalAmount { get; set; }

    public int ItemsCount { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class AdminRefundOrderResponseDto : AdminOrderActionResponseDto
{
    public IReadOnlyList<ReturnedInventoryItemDto> ReturnedInventory { get; set; } = Array.Empty<ReturnedInventoryItemDto>();
}

public class AdminCancelOrderResponseDto : AdminOrderActionResponseDto
{
    public IReadOnlyList<ReleasedInventoryItemDto> ReleasedInventory { get; set; } = Array.Empty<ReleasedInventoryItemDto>();
}

public class UpdateCodOrderStatusRequestDto
{
    public string Status { get; set; } = string.Empty;
}

public class ReturnedInventoryItemDto
{
    public int ProductVariantId { get; set; }

    public string Sku { get; set; } = string.Empty;

    public int QuantityReturned { get; set; }
}
