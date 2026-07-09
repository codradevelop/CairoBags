namespace CairoBags.Hubs;

/// <summary>SignalR group per user: must match <see cref="NotificationHub"/> join/leave and notification sends.</summary>
public static class NotificationGroupNames
{
    public const string Prefix = "user-";

    /// <summary>Shared admin group for future admin-only broadcasts (optional).</summary>
    public const string Admins = "admins";

    public static string ForUser(string userId) => $"{Prefix}{userId}";
}
