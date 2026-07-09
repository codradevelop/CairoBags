using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CairoBags.Hubs;

/// <summary>
/// Public statistics hub — broadcasts live home statistics to all connected storefront clients.
/// </summary>
[AllowAnonymous]
public class StatisticsHub : Hub
{
}
