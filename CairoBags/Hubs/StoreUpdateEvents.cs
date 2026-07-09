namespace CairoBags.Hubs;

/// <summary>Strongly typed SignalR method names for store synchronization.</summary>
public static class StoreUpdateEvents
{
    public const string CategoryCreated = "CategoryCreated";
    public const string CategoryUpdated = "CategoryUpdated";
    public const string CategoryDeleted = "CategoryDeleted";

    public const string ProductCreated = "ProductCreated";
    public const string ProductUpdated = "ProductUpdated";
    public const string ProductDeleted = "ProductDeleted";

    public const string InventoryUpdated = "InventoryUpdated";

    public const string ReviewCreated = "ReviewCreated";
    public const string ReviewUpdated = "ReviewUpdated";
    public const string ReviewDeleted = "ReviewDeleted";

    public const string CouponCreated = "CouponCreated";
    public const string CouponUpdated = "CouponUpdated";
    public const string CouponDeleted = "CouponDeleted";

    public const string BannerUpdated = "BannerUpdated";
    public const string StoreSettingsUpdated = "StoreSettingsUpdated";
}
