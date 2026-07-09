using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CairoBags.Hubs;

/// <summary>
/// Public storefront synchronization hub. All visitors join <see cref="StoreUpdateGroupNames.Storefront"/>.
/// Admins also join <see cref="StoreUpdateGroupNames.AdminCatalog"/> for admin catalog views.
/// </summary>
[AllowAnonymous]
public class StoreUpdateHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, StoreUpdateGroupNames.Storefront);

        if (Context.User?.IsInRole("Admin") == true)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, StoreUpdateGroupNames.AdminCatalog);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, StoreUpdateGroupNames.Storefront);

        if (Context.User?.IsInRole("Admin") == true)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, StoreUpdateGroupNames.AdminCatalog);
        }

        await base.OnDisconnectedAsync(exception);
    }
}
