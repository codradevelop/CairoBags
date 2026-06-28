using CairoBags.Dto.Coupons;
using CairoBags.Models.Coupons;

namespace CairoBags.Service;

public interface ICouponService
{
    Task<AdminCouponStatsDto> GetStatsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminCouponListItemDto>> GetCouponsAsync(
        AdminCouponFilterDto filter,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminCouponDetailDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminCouponUsageHistoryDto>> GetUsageHistoryAsync(
        int id,
        AdminCouponUsageFilterDto filter,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminCouponDetailDto>> CreateAsync(
        CreateCouponRequest request,
        string? userId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminCouponDetailDto>> UpdateAsync(
        int id,
        UpdateCouponRequest request,
        string? userId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminCouponDetailDto>> SetActiveAsync(
        int id,
        bool isActive,
        string? userId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AdminCouponDetailDto>> DuplicateAsync(
        int id,
        string? userId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<ValidateCouponResponseDto>> ValidateForCheckoutAsync(
        string userId,
        ValidateCouponRequest request,
        CancellationToken cancellationToken = default);

    Task<CouponValidationResult> ValidateCouponForOrderAsync(
        string? couponCode,
        string userId,
        decimal subTotal,
        IReadOnlyList<CouponValidationLineDto> lines,
        CancellationToken cancellationToken = default);
}

public sealed class CouponValidationResult
{
    public Coupon? Coupon { get; init; }

    public decimal DiscountAmount { get; init; }

    public string? ErrorCode { get; init; }

    public string? ErrorMessage { get; init; }

    public bool IsValid => string.IsNullOrEmpty(ErrorCode);

    public static CouponValidationResult Success(Coupon? coupon, decimal discount) =>
        new() { Coupon = coupon, DiscountAmount = discount };

    public static CouponValidationResult Fail(string code, string message) =>
        new() { ErrorCode = code, ErrorMessage = message };
}
