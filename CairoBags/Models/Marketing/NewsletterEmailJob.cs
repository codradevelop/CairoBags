namespace CairoBags.Models.Marketing;

public enum NewsletterEmailType : byte
{
    Welcome = 1,
    ProductLaunch = 2,
}

public enum NewsletterEmailStatus : byte
{
    Pending = 0,
    Processing = 1,
    Sent = 2,
    Failed = 3,
}

public class NewsletterEmailJob
{
    public int Id { get; set; }

    public int? SubscriberId { get; set; }

    public string ToEmail { get; set; } = string.Empty;

    public NewsletterEmailType EmailType { get; set; }

    public int? ProductId { get; set; }

    public string Subject { get; set; } = string.Empty;

    public string HtmlBody { get; set; } = string.Empty;

    public NewsletterEmailStatus Status { get; set; } = NewsletterEmailStatus.Pending;

    public int Retries { get; set; }

    public string? Error { get; set; }

    public DateTime? SentAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual NewsletterSubscriber? Subscriber { get; set; }
}
