namespace CairoBags.Models.Orders;

public enum OrderStatus : byte
{
    Pending = 1,
    AwaitingPayment = 2,
    PaymentProofSubmitted = 3,
    PaymentUnderReview = 4,
    PaymentConfirmed = 5,
    Processing = 6,
    Shipped = 7,
    Delivered = 8,
    Completed = 9,
    Cancelled = 10,
    Refunded = 11,
    /// <summary>COD workflow — order confirmed by admin.</summary>
    Confirmed = 12,
    /// <summary>COD workflow — order is being prepared.</summary>
    Preparing = 13,
    /// <summary>COD workflow — handed to shipping carrier.</summary>
    HandedToShipping = 14,
    /// <summary>COD workflow — arrived at local hub.</summary>
    AtLocalHub = 15,
    /// <summary>COD workflow — out for delivery.</summary>
    OutForDelivery = 16,
}
