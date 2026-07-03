using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CairoBags.Hubs;

/// <summary>
/// Public catalog hub — broadcasts product/category CRUD to all connected storefront and admin clients.
/// </summary>
[AllowAnonymous]
public class CatalogHub : Hub
{
}
