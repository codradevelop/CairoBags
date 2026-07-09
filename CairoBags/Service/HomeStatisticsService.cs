using CairoBags.Data;
using CairoBags.Dto.Home;
using CairoBags.Models.Catalog;
using CairoBags.Models.Orders;
using CairoBags.Models.Reviews;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class HomeStatisticsService : IHomeStatisticsService
{
    private const string CustomerRoleName = "Customer";

  private static readonly OrderStatus[] CompletedOrderStatuses =
    {
        OrderStatus.Delivered,
        OrderStatus.Completed,
    };

    private readonly CairoBagsContext _context;

    public HomeStatisticsService(CairoBagsContext context)
    {
        _context = context;
    }

    public Task<HomeStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken = default) =>
        BuildStatisticsAsync(cancellationToken);

    private async Task<HomeStatisticsDto> BuildStatisticsAsync(CancellationToken cancellationToken)
    {
        var registeredCustomers = await CountRegisteredCustomersAsync(cancellationToken);
        var premiumProducts = await CountPremiumProductsAsync(cancellationToken);
        var completedOrders = await CountCompletedOrdersAsync(cancellationToken);
        var customerSatisfaction = await CalculateCustomerSatisfactionAsync(cancellationToken);

        return new HomeStatisticsDto
        {
            RegisteredCustomers = registeredCustomers,
            PremiumProducts = premiumProducts,
            CompletedOrders = completedOrders,
            CustomerSatisfaction = customerSatisfaction,
        };
    }

    private async Task<int> CountRegisteredCustomersAsync(CancellationToken cancellationToken)
    {
        var customerRoleId = await _context.Roles
            .AsNoTracking()
            .Where(r => r.Name == CustomerRoleName)
            .Select(r => r.Id)
            .FirstOrDefaultAsync(cancellationToken);

        var profileCustomerIds = _context.CustomerProfiles
            .AsNoTracking()
            .Select(cp => cp.UserId);

        if (string.IsNullOrEmpty(customerRoleId))
            return await profileCustomerIds.Distinct().CountAsync(cancellationToken);

        var roleCustomerIds = _context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.RoleId == customerRoleId)
            .Select(ur => ur.UserId);

        return await roleCustomerIds
            .Union(profileCustomerIds)
            .CountAsync(cancellationToken);
    }

    private Task<int> CountPremiumProductsAsync(CancellationToken cancellationToken) =>
        _context.Products
            .AsNoTracking()
            .CountAsync(p => p.Status == ProductStatus.Active && !p.IsDeleted, cancellationToken);

    private Task<int> CountCompletedOrdersAsync(CancellationToken cancellationToken) =>
        _context.Orders
            .AsNoTracking()
            .CountAsync(o => CompletedOrderStatuses.Contains(o.Status), cancellationToken);

    private async Task<int> CalculateCustomerSatisfactionAsync(CancellationToken cancellationToken)
    {
        var approvedReviews = _context.ProductReviews
            .AsNoTracking()
            .Where(r => r.Status == ReviewStatus.Approved);

        var reviewCount = await approvedReviews.CountAsync(cancellationToken);
        if (reviewCount == 0)
            return 100;

        var averageRating = await approvedReviews.AverageAsync(r => (double)r.Rating, cancellationToken);
        return (int)Math.Round(averageRating / 5d * 100d, MidpointRounding.AwayFromZero);
    }
}
