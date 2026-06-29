using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CairoBags.Hubs;

/// <summary>
/// Per-user group <c>user-{userId}</c> for all authenticated users.
/// Admins also join <c>admins</c> for optional admin-only broadcasts.
/// Notification delivery always targets <see cref="NotificationGroupNames.ForUser"/> only.
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, NotificationGroupNames.ForUser(userId));
        }

        if (Context.User?.IsInRole("Admin") == true)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, NotificationGroupNames.Admins);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, NotificationGroupNames.ForUser(userId));
        }

        if (Context.User?.IsInRole("Admin") == true)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, NotificationGroupNames.Admins);
        }

        await base.OnDisconnectedAsync(exception);
    }
}
