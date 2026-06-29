using CairoBags.Models.Coupons;

namespace CairoBags.Service;

public interface IShippingFeeService
{
    Task<decimal?> ResolveGovernorateFeeAsync(string governorateName, CancellationToken cancellationToken = default);

    Task<bool> IsKnownGovernorateAsync(string governorateName, CancellationToken cancellationToken = default);

    Task<decimal> CalculateShippingFeeAsync(
        string governorateName,
        Coupon? coupon,
        CancellationToken cancellationToken = default);
}
