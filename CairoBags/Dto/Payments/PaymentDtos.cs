using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace CairoBags.Dto.Payments;

public class SubmitPaymentProofRequest
{
    [Required]
    [MaxLength(200)]
    public string SenderName { get; set; } = string.Empty;

    [Required]
    [MaxLength(32)]
    public string SenderPhone { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string TransactionReference { get; set; } = string.Empty;

    public List<IFormFile>? ProofFiles { get; set; }

    public List<IFormFile>? Files { get; set; }

    public IFormFile? File { get; set; }

    public IReadOnlyList<IFormFile> GetUploadedProofFiles()
    {
        var proofFiles = new List<IFormFile>();
        if (ProofFiles != null)
            proofFiles.AddRange(ProofFiles.Where(f => f != null && f.Length > 0));
        if (proofFiles.Count == 0 && Files != null)
            proofFiles.AddRange(Files.Where(f => f != null && f.Length > 0));
        if (proofFiles.Count == 0 && File != null && File.Length > 0)
            proofFiles.Add(File);
        return proofFiles;
    }
}

public class RejectPaymentRequest
{
    [Required]
    [MaxLength(1000)]
    public string RejectionReason { get; set; } = string.Empty;
}

public class PaymentProofImageDto
{
    public int Id { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public bool IsPrimary { get; set; }
}

public class PaymentDetailDto
{
    public int OrderId { get; set; }

    public int PaymentId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public string PaymentMethod { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;

    public string? OrderStatus { get; set; }

    public decimal Amount { get; set; }

    public string? SenderName { get; set; }

    public string? SenderPhone { get; set; }

    public string? TransactionReference { get; set; }

    public IReadOnlyList<PaymentProofImageDto> ProofImages { get; set; } = Array.Empty<PaymentProofImageDto>();

    public string? RejectionReason { get; set; }

    public DateTime? RejectedAt { get; set; }
}

public class AdminPendingPaymentDto
{
    public int PaymentId { get; set; }

    public int OrderId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public string PaymentMethod { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string? SenderName { get; set; }

    public string? SenderPhone { get; set; }

    public string? TransactionReference { get; set; }

    public DateTime SubmittedAt { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public string? CustomerEmail { get; set; }

    public string? PrimaryProofImageUrl { get; set; }
}

public class AdminPaymentDetailDto : PaymentDetailDto
{
    public string CustomerName { get; set; } = string.Empty;

    public string? CustomerEmail { get; set; }

    public string? CustomerPhone { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public string? ReviewedBy { get; set; }

    public string? ReviewNotes { get; set; }
}
