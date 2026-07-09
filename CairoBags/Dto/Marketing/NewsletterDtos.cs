using System.ComponentModel.DataAnnotations;

namespace CairoBags.Dto.Marketing;

public class SubscribeNewsletterRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(320)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(2)]
    public string? Language { get; set; }
}

public class UnsubscribeNewsletterRequest
{
    [Required]
    [MaxLength(64)]
    public string Token { get; set; } = string.Empty;
}

public class NewsletterSubscriberDto
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public bool IsSubscribed { get; set; }

    public DateTime SubscribedAt { get; set; }

    public DateTime? UnsubscribedAt { get; set; }

    public DateTime? LastEmailSentAt { get; set; }

    public string Language { get; set; } = "en";

    public DateTime CreatedAt { get; set; }
}

public class NewsletterStatsDto
{
    public int TotalSubscribers { get; set; }

    public int SubscribedToday { get; set; }

    public int Unsubscribed { get; set; }

    public int EmailsSent { get; set; }

    public ProductLaunchCampaignDto? LastCampaign { get; set; }
}

public class ProductLaunchCampaignDto
{
    public int ProductId { get; set; }

    public string? ProductName { get; set; }

    public DateTime SentAt { get; set; }

    public int RecipientCount { get; set; }
}

public class AdminNewsletterFilterDto
{
    public string? Search { get; set; }

    public bool? IsSubscribed { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 20;
}

public class PagedNewsletterSubscribersDto
{
    public IReadOnlyList<NewsletterSubscriberDto> Items { get; set; } = Array.Empty<NewsletterSubscriberDto>();

    public int Total { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }
}

public class SubscribeNewsletterResponse
{
    public string Message { get; set; } = string.Empty;
}

public class UnsubscribeNewsletterResponse
{
    public string Message { get; set; } = string.Empty;
}

public class NewsletterMeResponse
{
    public bool IsSubscribed { get; set; }
}
