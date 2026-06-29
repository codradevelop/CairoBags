using CairoBags.Data;
using CairoBags.Models.Coupons;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class ShippingFeeService : IShippingFeeService
{
    private static readonly Dictionary<string, string> LegacyGovernorateAliases =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Matrouh"] = "Marsa Matruh",
            ["قاهره"] = "Cairo",
            ["قاهرة"] = "Cairo",
            ["القاهره"] = "Cairo",
            ["الجيزه"] = "Giza",
            ["الجيزة"] = "Giza",
            ["اسكندريه"] = "Alexandria",
            ["الإسكندرية"] = "Alexandria",
            ["الاسكندرية"] = "Alexandria",
        };

    private readonly CairoBagsContext _context;

    public ShippingFeeService(CairoBagsContext context)
    {
        _context = context;
    }

    public async Task<decimal?> ResolveGovernorateFeeAsync(
        string governorateName,
        CancellationToken cancellationToken = default)
    {
        var trimmed = governorateName?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(trimmed))
            return null;

        var normalized = NormalizeGovernorateName(trimmed);

        var governorate = await _context.Governorates
            .AsNoTracking()
            .FirstOrDefaultAsync(
                g =>
                    g.NameEn == normalized ||
                    g.NameAr == normalized ||
                    g.NameEn == trimmed ||
                    g.NameAr == trimmed,
                cancellationToken);

        return governorate?.ShippingFee;
    }

    public async Task<bool> IsKnownGovernorateAsync(
        string governorateName,
        CancellationToken cancellationToken = default)
    {
        var fee = await ResolveGovernorateFeeAsync(governorateName, cancellationToken);
        return fee.HasValue;
    }

    public async Task<decimal> CalculateShippingFeeAsync(
        string governorateName,
        Coupon? coupon,
        CancellationToken cancellationToken = default)
    {
        if (coupon?.Type == CouponType.FreeShipping)
            return 0m;

        return await ResolveGovernorateFeeAsync(governorateName, cancellationToken) ?? 0m;
    }

    private static string NormalizeGovernorateName(string? governorateName)
    {
        var trimmed = governorateName?.Trim();
        if (string.IsNullOrEmpty(trimmed))
            return string.Empty;

        return LegacyGovernorateAliases.TryGetValue(trimmed, out var alias) ? alias : trimmed;
    }
}
