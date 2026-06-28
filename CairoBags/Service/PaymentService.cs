using CairoBags.Data;
using CairoBags.Dto.Payments;
using CairoBags.Helpers;
using CairoBags.Models;
using CairoBags.Models.Identity;
using CairoBags.Models.Orders;
using CairoBags.Models.Payments;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class PaymentService : IPaymentService
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    private static readonly PaymentMethodType[] WalletPaymentMethods =
    {
        PaymentMethodType.InstaPay,
        PaymentMethodType.VodafoneCash,
        PaymentMethodType.OrangeCash,
        PaymentMethodType.EtisalatCash,
        PaymentMethodType.WEPay
    };

    private static readonly OrderStatus[] BlockedOrderStatuses =
    {
        OrderStatus.Cancelled,
        OrderStatus.Delivered,
        OrderStatus.Refunded
    };

    private readonly CairoBagsContext _context;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly NotificationService _notificationService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        CairoBagsContext context,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        NotificationService notificationService,
        UserManager<ApplicationUser> userManager,
        ILogger<PaymentService> logger)
    {
        _context = context;
        _configuration = configuration;
        _environment = environment;
        _notificationService = notificationService;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<ServiceResult<PaymentDetailDto>> SubmitProofAsync(
        string userId,
        int orderId,
        SubmitPaymentProofRequest request,
        CancellationToken cancellationToken = default)
    {
        var files = request.GetUploadedProofFiles();
        if (files.Count == 0)
            return ServiceResult<PaymentDetailDto>.Fail("file_required", "Payment proof image is required.");

        var fileValidation = await ValidateProofFilesAsync(files, cancellationToken);
        if (fileValidation.Error != null)
            return ServiceResult<PaymentDetailDto>.Fail(
                fileValidation.Error.ErrorCode,
                fileValidation.Error.Message,
                fileValidation.Error.StatusCode);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await _context.Orders
                .Include(o => o.Payment!)
                    .ThenInclude(p => p.PaymentMethod)
                .Include(o => o.Payment!)
                    .ThenInclude(p => p.ProofImages)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId, cancellationToken);

            if (order == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<PaymentDetailDto>.Fail(
                    "order_not_found",
                    "Order not found.",
                    StatusCodes.Status404NotFound);
            }

            var validationError = ValidateProofSubmission(order);
            if (validationError != null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<PaymentDetailDto>.Fail(
                    validationError.ErrorCode,
                    validationError.Message,
                    validationError.StatusCode);
            }

            var payment = order.Payment!;
            var now = DateTime.UtcNow;
            var oldOrderStatus = order.Status;

            payment.SenderName = request.SenderName.Trim();
            payment.SenderPhone = request.SenderPhone.Trim();
            payment.TransactionReference = request.TransactionReference.Trim();
            payment.Status = PaymentStatus.ProofSubmitted;
            payment.UpdatedAt = now;
            payment.UpdatedBy = userId;
            payment.ReviewedAt = null;
            payment.ReviewedBy = null;
            payment.ReviewNotes = null;

            order.Status = OrderStatus.PaymentProofSubmitted;
            order.UpdatedAt = now;
            order.UpdatedBy = userId;
            order.StatusHistory.Add(new OrderStatusHistory
            {
                OldStatus = oldOrderStatus,
                NewStatus = OrderStatus.PaymentProofSubmitted,
                Notes = "Customer submitted payment proof.",
                CreatedAt = now,
                CreatedBy = userId
            });

            foreach (var image in payment.ProofImages.Where(i => i.IsPrimary))
                image.IsPrimary = false;

            var savedPaths = new List<string>();
            var existingCount = payment.ProofImages.Count;

            for (var i = 0; i < fileValidation.Files!.Count; i++)
            {
                var (file, normalizedContentType) = fileValidation.Files[i];
                var saveResult = await SaveProofFileAsync(orderId, existingCount + i + 1, file, normalizedContentType, cancellationToken);
                if (!saveResult.Succeeded || saveResult.Data == null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    DeletePhysicalFiles(savedPaths);
                    return ServiceResult<PaymentDetailDto>.Fail(
                        saveResult.ErrorCode!,
                        saveResult.Message!,
                        saveResult.StatusCode ?? StatusCodes.Status400BadRequest);
                }

                savedPaths.Add(saveResult.Data);
                var isPrimary = i == fileValidation.Files.Count - 1;

                payment.ProofImages.Add(new PaymentProofImage
                {
                    ImageUrl = saveResult.Data,
                    IsPrimary = isPrimary,
                    CreatedAt = now,
                    CreatedBy = userId
                });
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await NotifyPaymentSubmittedAsync(order, payment, cancellationToken);

            return ServiceResult<PaymentDetailDto>.Ok(MapPaymentDetail(order, payment));
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ServiceResult<PaymentDetailDto>> GetPaymentByOrderIdAsync(
        string userId,
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Payment!)
                .ThenInclude(p => p.PaymentMethod)
            .Include(o => o.Payment!)
                .ThenInclude(p => p.ProofImages)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId, cancellationToken);

        if (order?.Payment == null)
        {
            return ServiceResult<PaymentDetailDto>.Fail(
                "order_not_found",
                "Order not found.",
                StatusCodes.Status404NotFound);
        }

        return ServiceResult<PaymentDetailDto>.Ok(MapPaymentDetail(order, order.Payment));
    }

    public async Task<IReadOnlyList<AdminPendingPaymentDto>> GetPendingReviewsAsync(
        CancellationToken cancellationToken = default)
    {
        var payments = await _context.OrderPayments
            .AsNoTracking()
            .Include(p => p.Order)
                .ThenInclude(o => o.User)
            .Include(p => p.PaymentMethod)
            .Include(p => p.ProofImages)
            .Where(p => p.Status == PaymentStatus.ProofSubmitted)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync(cancellationToken);

        return payments.Select(MapPendingPayment).ToList();
    }

    public async Task<ServiceResult<AdminPaymentDetailDto>> GetPaymentByIdAsync(
        int paymentId,
        CancellationToken cancellationToken = default)
    {
        var payment = await _context.OrderPayments
            .AsNoTracking()
            .Include(p => p.Order)
                .ThenInclude(o => o.User)
            .Include(p => p.PaymentMethod)
            .Include(p => p.ProofImages)
            .FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken);

        if (payment == null)
        {
            return ServiceResult<AdminPaymentDetailDto>.Fail(
                "payment_not_found",
                "Payment not found.",
                StatusCodes.Status404NotFound);
        }

        return ServiceResult<AdminPaymentDetailDto>.Ok(MapAdminPaymentDetail(payment));
    }

    public async Task<ServiceResult<PaymentDetailDto>> ApprovePaymentAsync(
        int paymentId,
        string adminUserId,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var payment = await _context.OrderPayments
                .Include(p => p.Order)
                .Include(p => p.PaymentMethod)
                .Include(p => p.ProofImages)
                .FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken);

            if (payment == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<PaymentDetailDto>.Fail(
                    "payment_not_found",
                    "Payment not found.",
                    StatusCodes.Status404NotFound);
            }

            if (payment.Status == PaymentStatus.Confirmed)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<PaymentDetailDto>.Fail(
                    "payment_already_confirmed",
                    "Payment has already been confirmed.");
            }

            if (payment.Status != PaymentStatus.ProofSubmitted)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<PaymentDetailDto>.Fail(
                    "payment_not_reviewable",
                    "Only submitted payment proofs can be approved.");
            }

            var now = DateTime.UtcNow;
            var oldOrderStatus = payment.Order.Status;

            payment.Status = PaymentStatus.Confirmed;
            payment.ReviewedAt = now;
            payment.ReviewedBy = adminUserId;
            payment.ReviewNotes = null;
            payment.UpdatedAt = now;
            payment.UpdatedBy = adminUserId;

            payment.Order.Status = OrderStatus.Processing;
            payment.Order.UpdatedAt = now;
            payment.Order.UpdatedBy = adminUserId;
            payment.Order.StatusHistory.Add(new OrderStatusHistory
            {
                OldStatus = oldOrderStatus,
                NewStatus = OrderStatus.Processing,
                Notes = "Payment confirmed by admin.",
                CreatedAt = now,
                CreatedBy = adminUserId
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _notificationService.TryCreateAndNotifyAsync(
                payment.Order.UserId,
                "Payment confirmed",
                $"Your payment for order {payment.Order.OrderNumber} has been confirmed. We are now processing your order.",
                NotificationType.PaymentConfirmed,
                NotificationTargetTypes.OrderPayment,
                payment.OrderId,
                payment.Order.OrderNumber,
                cancellationToken);

            return ServiceResult<PaymentDetailDto>.Ok(MapPaymentDetail(payment.Order, payment));
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ServiceResult<PaymentDetailDto>> RejectPaymentAsync(
        int paymentId,
        string adminUserId,
        RejectPaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var payment = await _context.OrderPayments
                .Include(p => p.Order)
                .Include(p => p.PaymentMethod)
                .Include(p => p.ProofImages)
                .FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken);

            if (payment == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<PaymentDetailDto>.Fail(
                    "payment_not_found",
                    "Payment not found.",
                    StatusCodes.Status404NotFound);
            }

            if (payment.Status == PaymentStatus.Confirmed)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<PaymentDetailDto>.Fail(
                    "payment_already_confirmed",
                    "Confirmed payments cannot be rejected.");
            }

            if (payment.Status != PaymentStatus.ProofSubmitted)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<PaymentDetailDto>.Fail(
                    "payment_not_reviewable",
                    "Only submitted payment proofs can be rejected.");
            }

            var now = DateTime.UtcNow;
            var oldOrderStatus = payment.Order.Status;
            var rejectionReason = request.RejectionReason.Trim();

            payment.Status = PaymentStatus.Rejected;
            payment.ReviewedAt = now;
            payment.ReviewedBy = adminUserId;
            payment.ReviewNotes = rejectionReason;
            payment.UpdatedAt = now;
            payment.UpdatedBy = adminUserId;

            payment.Order.Status = OrderStatus.AwaitingPayment;
            payment.Order.UpdatedAt = now;
            payment.Order.UpdatedBy = adminUserId;
            payment.Order.StatusHistory.Add(new OrderStatusHistory
            {
                OldStatus = oldOrderStatus,
                NewStatus = OrderStatus.AwaitingPayment,
                Notes = rejectionReason,
                CreatedAt = now,
                CreatedBy = adminUserId
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _notificationService.TryCreateAndNotifyAsync(
                payment.Order.UserId,
                "Payment rejected",
                $"Your payment proof for order {payment.Order.OrderNumber} was rejected. Reason: {rejectionReason}",
                NotificationType.PaymentRejected,
                NotificationTargetTypes.OrderPayment,
                payment.OrderId,
                payment.Order.OrderNumber,
                cancellationToken);

            return ServiceResult<PaymentDetailDto>.Ok(MapPaymentDetail(payment.Order, payment));
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static ServiceError? ValidateProofSubmission(Order order)
    {
        if (order.Payment == null)
            return new ServiceError("payment_not_found", "Payment record not found for this order.", StatusCodes.Status404NotFound);

        if (BlockedOrderStatuses.Contains(order.Status))
            return new ServiceError("order_not_eligible", "Payment proof cannot be submitted for this order.");

        if (order.Status != OrderStatus.AwaitingPayment)
            return new ServiceError("invalid_order_status", "Payment proof can only be submitted while the order is awaiting payment.");

        if (!WalletPaymentMethods.Contains(order.Payment.PaymentMethod.Type))
            return new ServiceError("payment_method_not_supported", "Payment proof upload is only available for wallet payment methods.");

        if (order.Payment.Status != PaymentStatus.Pending && order.Payment.Status != PaymentStatus.Rejected)
            return new ServiceError("invalid_payment_status", "Payment proof can only be submitted when payment is pending or was rejected.");

        return null;
    }

    private async Task<(List<(IFormFile File, string ContentType)>? Files, ServiceError? Error)> ValidateProofFilesAsync(
        IReadOnlyList<IFormFile> files,
        CancellationToken cancellationToken)
    {
        var validated = new List<(IFormFile File, string ContentType)>();

        foreach (var file in files)
        {
            if (file == null || file.Length == 0)
                return (null, new ServiceError("file_required", "Payment proof image is required."));

            if (file.Length > MaxFileSizeBytes)
                return (null, new ServiceError("file_too_large", "Each image must be 10 MB or smaller."));

            if (!ImageValidationHelper.IsAllowedContentType(file.ContentType))
                return (null, new ServiceError("invalid_file_type", "Invalid image type. Allowed types: JPEG, PNG, WebP."));

            await using var validationStream = file.OpenReadStream();
            if (!ImageValidationHelper.HasValidImageSignature(validationStream, out var normalizedContentType))
                return (null, new ServiceError("invalid_file_signature", "File content is not a valid image."));

            validated.Add((file, normalizedContentType));
        }

        return (validated, null);
    }

    private async Task<ServiceResult<string>> SaveProofFileAsync(
        int orderId,
        int sequence,
        IFormFile file,
        string normalizedContentType,
        CancellationToken cancellationToken)
    {
        var extension = ExtensionForContentType(normalizedContentType);
        var fileName = $"proof-{sequence}{extension}";

        var storageFolder = _configuration["FileStorage:Path"] ?? "FileStorage";
        var rootPath = _environment.ContentRootPath ?? Directory.GetCurrentDirectory();
        var paymentDir = Path.Combine(rootPath, storageFolder, "payments", orderId.ToString());

        Directory.CreateDirectory(paymentDir);

        var fullPath = Path.Combine(paymentDir, fileName);
        await using (var output = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(output, cancellationToken);
        }

        var relativePath = $"/{storageFolder}/payments/{orderId}/{fileName}";
        return ServiceResult<string>.Ok(relativePath);
    }

    private async Task NotifyPaymentSubmittedAsync(Order order, OrderPayment payment, CancellationToken cancellationToken)
    {
        await _notificationService.TryCreateAndNotifyAsync(
            order.UserId,
            "Payment proof submitted",
            $"Your payment proof for order {order.OrderNumber} has been submitted and is awaiting review.",
            NotificationType.PaymentSubmitted,
            NotificationTargetTypes.OrderPayment,
            order.Id,
            order.OrderNumber,
            cancellationToken);

        var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
        if (adminUsers.Count == 0)
            return;

        await _notificationService.BroadcastToUsersAsync(
            adminUsers.Select(u => u.Id),
            "Payment proof awaiting review",
            $"Order {order.OrderNumber} has a new payment proof awaiting review.",
            NotificationType.PaymentSubmitted,
            NotificationTargetTypes.AdminPayments,
            order.Id,
            cancellationToken: cancellationToken);
    }

    private void DeletePhysicalFiles(IEnumerable<string> relativePaths)
    {
        foreach (var relativePath in relativePaths)
        {
            try
            {
                var storageFolder = _configuration["FileStorage:Path"] ?? "FileStorage";
                var prefix = $"/{storageFolder}/";
                if (!relativePath.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                    continue;

                var relative = relativePath[prefix.Length..].Replace('/', Path.DirectorySeparatorChar);
                var rootPath = _environment.ContentRootPath ?? Directory.GetCurrentDirectory();
                var fullPath = Path.Combine(rootPath, storageFolder, relative);

                if (File.Exists(fullPath))
                    File.Delete(fullPath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete payment proof file {ImageUrl}", relativePath);
            }
        }
    }

    private static PaymentDetailDto MapPaymentDetail(Order order, OrderPayment payment) =>
        new()
        {
            OrderId = order.Id,
            PaymentId = payment.Id,
            OrderNumber = order.OrderNumber,
            PaymentMethod = payment.PaymentMethod.Type.ToString(),
            PaymentStatus = payment.Status.ToString(),
            OrderStatus = order.Status.ToString(),
            Amount = payment.Amount,
            SenderName = payment.SenderName,
            SenderPhone = payment.SenderPhone,
            TransactionReference = payment.TransactionReference,
            ProofImages = payment.ProofImages
                .OrderByDescending(i => i.IsPrimary)
                .ThenByDescending(i => i.CreatedAt)
                .Select(MapProofImage)
                .ToList(),
            RejectionReason = payment.Status == PaymentStatus.Rejected ? payment.ReviewNotes : null,
            RejectedAt = payment.Status == PaymentStatus.Rejected ? payment.ReviewedAt : null
        };

    private static AdminPaymentDetailDto MapAdminPaymentDetail(OrderPayment payment) =>
        new()
        {
            OrderId = payment.OrderId,
            PaymentId = payment.Id,
            OrderNumber = payment.Order.OrderNumber,
            PaymentMethod = payment.PaymentMethod.Type.ToString(),
            PaymentStatus = payment.Status.ToString(),
            OrderStatus = payment.Order.Status.ToString(),
            Amount = payment.Amount,
            SenderName = payment.SenderName,
            SenderPhone = payment.SenderPhone,
            TransactionReference = payment.TransactionReference,
            CustomerName = payment.Order.ShippingFullName,
            CustomerEmail = payment.Order.User?.Email,
            CustomerPhone = payment.Order.ShippingPhoneNumber,
            ReviewedAt = payment.ReviewedAt,
            ReviewedBy = payment.ReviewedBy,
            ReviewNotes = payment.ReviewNotes,
            ProofImages = payment.ProofImages
                .OrderByDescending(i => i.IsPrimary)
                .ThenByDescending(i => i.CreatedAt)
                .Select(MapProofImage)
                .ToList()
        };

    private static AdminPendingPaymentDto MapPendingPayment(OrderPayment payment) =>
        new()
        {
            PaymentId = payment.Id,
            OrderId = payment.OrderId,
            OrderNumber = payment.Order.OrderNumber,
            PaymentMethod = payment.PaymentMethod.Type.ToString(),
            PaymentStatus = payment.Status.ToString(),
            Amount = payment.Amount,
            SenderName = payment.SenderName,
            SenderPhone = payment.SenderPhone,
            TransactionReference = payment.TransactionReference,
            SubmittedAt = payment.UpdatedAt ?? payment.CreatedAt,
            CustomerName = payment.Order.ShippingFullName,
            CustomerEmail = payment.Order.User?.Email,
            PrimaryProofImageUrl = payment.ProofImages
                .Where(i => i.IsPrimary)
                .Select(i => i.ImageUrl)
                .FirstOrDefault()
                ?? payment.ProofImages
                    .OrderByDescending(i => i.CreatedAt)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault()
        };

    private static PaymentProofImageDto MapProofImage(PaymentProofImage image) =>
        new()
        {
            Id = image.Id,
            ImageUrl = image.ImageUrl,
            IsPrimary = image.IsPrimary
        };

    private static string ExtensionForContentType(string contentType) =>
        contentType switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".jpg"
        };

    private sealed record ServiceError(string ErrorCode, string Message, int StatusCode = StatusCodes.Status400BadRequest);
}
