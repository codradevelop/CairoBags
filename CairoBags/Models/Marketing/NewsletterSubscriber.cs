namespace CairoBags.Models.Marketing;

public class NewsletterSubscriber
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public bool IsSubscribed { get; set; } = true;

    public DateTime SubscribedAt { get; set; }

    public DateTime? UnsubscribedAt { get; set; }

    public DateTime? LastEmailSentAt { get; set; }

    public string Language { get; set; } = "en";

    public string UnsubscribeToken { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
