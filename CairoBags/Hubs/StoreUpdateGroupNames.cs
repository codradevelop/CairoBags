namespace CairoBags.Hubs;

/// <summary>
/// SignalR groups for storefront-wide catalog synchronization.
/// </summary>
public static class StoreUpdateGroupNames
{
    /// <summary>Anonymous and authenticated storefront clients.</summary>
    public const string Storefront = "storefront";

    /// <summary>Authenticated admin clients (catalog management views).</summary>
    public const string AdminCatalog = "admin-catalog";
}
