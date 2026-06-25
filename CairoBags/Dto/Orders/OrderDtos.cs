namespace CairoBags.Dto.Orders;

public class OrderListItemDto
{
    public int OrderId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public string OrderStatus { get; set; } = string.Empty;

    public string? PaymentStatus { get; set; }

    public decimal TotalAmount { get; set; }

    public int ItemsCount { get; set; }

    public string? PrimaryProductImage { get; set; }

    public IReadOnlyList<OrderItemReviewStatusDto> ReviewableItems { get; set; } = Array.Empty<OrderItemReviewStatusDto>();
}

public class OrderDetailDto
{
    public OrderInformationDto Order { get; set; } = new();

    public OrderShippingAddressDto ShippingAddress { get; set; } = new();

    public OrderPaymentInfoDto? Payment { get; set; }

    public IReadOnlyList<OrderItemDto> Items { get; set; } = Array.Empty<OrderItemDto>();

    public OrderCouponInfoDto? Coupon { get; set; }

    public IReadOnlyList<OrderStatusHistoryDto> StatusHistory { get; set; } = Array.Empty<OrderStatusHistoryDto>();
}

public class OrderInformationDto
{
    public int OrderId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public string OrderStatus { get; set; } = string.Empty;

    public decimal SubTotal { get; set; }

    public decimal ShippingFee { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal TotalAmount { get; set; }

    public string CurrencyCode { get; set; } = "EGP";

    public string? Notes { get; set; }
}

public class OrderShippingAddressDto
{
    public string FullName { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string Governorate { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string AddressLine1 { get; set; } = string.Empty;

    public string? AddressLine2 { get; set; }

    public string? PostalCode { get; set; }
}

public class OrderPaymentInfoDto
{
    public int PaymentId { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string? SenderName { get; set; }

    public string? SenderPhone { get; set; }

    public string? TransactionReference { get; set; }
}

public class OrderItemDto
{
    public int OrderItemId { get; set; }

    public int ProductId { get; set; }

    public int ProductVariantId { get; set; }

    public string ProductNameAr { get; set; } = string.Empty;

    public string ProductNameEn { get; set; } = string.Empty;

    public string ColorNameAr { get; set; } = string.Empty;

    public string ColorNameEn { get; set; } = string.Empty;

    public string Sku { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal LineTotal { get; set; }

    public string? ImageUrl { get; set; }

    public bool HasReviewed { get; set; }

    public int? ReviewId { get; set; }

    public byte? ReviewRating { get; set; }

    public string? ReviewTitle { get; set; }

    public string? ReviewComment { get; set; }
}

public class OrderItemReviewStatusDto
{
    public int ProductId { get; set; }

    public string ProductNameAr { get; set; } = string.Empty;

    public string ProductNameEn { get; set; } = string.Empty;

    public bool HasReviewed { get; set; }

    public int? ReviewId { get; set; }

    public byte? ReviewRating { get; set; }

    public string? ReviewTitle { get; set; }

    public string? ReviewComment { get; set; }
}

public class OrderCouponInfoDto
{
    public string Code { get; set; } = string.Empty;

    public decimal DiscountAmount { get; set; }
}

public class OrderStatusHistoryDto
{
    public string? OldStatus { get; set; }

    public string NewStatus { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class ReleasedInventoryItemDto
{
    public int ProductVariantId { get; set; }

    public string Sku { get; set; } = string.Empty;

    public int QuantityReleased { get; set; }
}

public class CancelOrderResponseDto
{
    public int OrderId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public string OrderStatus { get; set; } = string.Empty;

    public IReadOnlyList<ReleasedInventoryItemDto> ReleasedInventory { get; set; } = Array.Empty<ReleasedInventoryItemDto>();
}
