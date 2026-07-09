using System.Globalization;
using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;
using CairoBags.Data;
using CairoBags.Dto.Marketing;
using CairoBags.Models.Catalog;
using CairoBags.Models.Marketing;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public partial class NewsletterService : INewsletterService
{
    private const int MaxRetries = 3;
    private const int ExportMaxRows = 50_000;

    private readonly CairoBagsContext _context;
    private readonly IEmailQueue _emailQueue;
    private readonly IConfiguration _config;
    private readonly ILogger<NewsletterService> _logger;

    public NewsletterService(
        CairoBagsContext context,
        IEmailQueue emailQueue,
        IConfiguration config,
        ILogger<NewsletterService> logger)
    {
        _context = context;
        _emailQueue = emailQueue;
        _config = config;
        _logger = logger;
    }

    public async Task<ServiceResult<SubscribeNewsletterResponse>> SubscribeAsync(
        SubscribeNewsletterRequest request,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (!IsValidEmail(normalizedEmail))
            return ServiceResult<SubscribeNewsletterResponse>.Fail("invalid_email", "Please enter a valid email address.");

        var language = NormalizeLanguage(request.Language);
        var now = DateTime.UtcNow;

        var existing = await _context.NewsletterSubscribers
            .FirstOrDefaultAsync(s => s.Email == normalizedEmail, cancellationToken);

        if (existing != null)
        {
            if (existing.IsSubscribed)
                return ServiceResult<SubscribeNewsletterResponse>.Fail("already_subscribed", "This email is already subscribed.");

            existing.IsSubscribed = true;
            existing.SubscribedAt = now;
            existing.UnsubscribedAt = null;
            existing.Language = language;
            existing.UpdatedAt = now;
            if (string.IsNullOrWhiteSpace(existing.UnsubscribeToken))
                existing.UnsubscribeToken = GenerateToken();
        }
        else
        {
            existing = new NewsletterSubscriber
            {
                Email = normalizedEmail,
                IsSubscribed = true,
                SubscribedAt = now,
                Language = language,
                UnsubscribeToken = GenerateToken(),
                CreatedAt = now,
            };
            _context.NewsletterSubscribers.Add(existing);
        }

        await _context.SaveChangesAsync(cancellationToken);

        await EnqueueWelcomeEmailAsync(existing, cancellationToken);

        return ServiceResult<SubscribeNewsletterResponse>.Ok(new SubscribeNewsletterResponse
        {
            Message = "Thank you for subscribing!",
        });
    }

    public async Task<ServiceResult<UnsubscribeNewsletterResponse>> UnsubscribeAsync(
        string token,
        CancellationToken cancellationToken = default)
    {
        var normalizedToken = (token ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalizedToken))
            return ServiceResult<UnsubscribeNewsletterResponse>.Fail("invalid_token", "Invalid unsubscribe link.", StatusCodes.Status404NotFound);

        var subscriber = await _context.NewsletterSubscribers
            .FirstOrDefaultAsync(s => s.UnsubscribeToken == normalizedToken, cancellationToken);

        if (subscriber == null)
            return ServiceResult<UnsubscribeNewsletterResponse>.Fail("not_found", "Subscriber not found.", StatusCodes.Status404NotFound);

        if (!subscriber.IsSubscribed)
        {
            return ServiceResult<UnsubscribeNewsletterResponse>.Ok(new UnsubscribeNewsletterResponse
            {
                Message = "You have successfully unsubscribed.",
            });
        }

        var now = DateTime.UtcNow;
        subscriber.IsSubscribed = false;
        subscriber.UnsubscribedAt = now;
        subscriber.UpdatedAt = now;
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<UnsubscribeNewsletterResponse>.Ok(new UnsubscribeNewsletterResponse
        {
            Message = "You have successfully unsubscribed.",
        });
    }

    public async Task<NewsletterMeResponse> GetSubscriptionStatusAsync(
        string? email,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            return new NewsletterMeResponse { IsSubscribed = false };

        var normalizedEmail = NormalizeEmail(email);
        var isSubscribed = await _context.NewsletterSubscribers
            .AsNoTracking()
            .AnyAsync(s => s.Email == normalizedEmail && s.IsSubscribed, cancellationToken);

        return new NewsletterMeResponse { IsSubscribed = isSubscribed };
    }

    public async Task EnqueueProductLaunchEmailsAsync(int productId, CancellationToken cancellationToken = default)
    {
        var alreadySent = await _context.ProductLaunchNotifications
            .AsNoTracking()
            .AnyAsync(n => n.ProductId == productId, cancellationToken);

        if (alreadySent)
        {
            _logger.LogInformation("Product launch email already sent for product {ProductId}. Skipping.", productId);
            return;
        }

        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .Include(p => p.Category).ThenInclude(c => c.Translations)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == productId && !p.IsDeleted, cancellationToken);

        if (product == null || product.Status != ProductStatus.Active)
            return;

        var subscribers = await _context.NewsletterSubscribers
            .AsNoTracking()
            .Where(s => s.IsSubscribed)
            .ToListAsync(cancellationToken);

        if (subscribers.Count == 0)
        {
            _logger.LogInformation("No active subscribers for product launch email {ProductId}.", productId);
            return;
        }

        var notification = new ProductLaunchNotification
        {
            ProductId = productId,
            SentAt = DateTime.UtcNow,
            RecipientCount = subscribers.Count,
            CreatedAt = DateTime.UtcNow,
        };

        _context.ProductLaunchNotifications.Add(notification);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "Duplicate product launch notification for product {ProductId}. Skipping.", productId);
            return;
        }

        var frontendBase = GetFrontendBaseUrl();
        var enTranslation = product.Translations.FirstOrDefault(t => t.LanguageCode == "en")
            ?? product.Translations.FirstOrDefault();
        var slug = enTranslation?.Slug ?? product.Id.ToString(CultureInfo.InvariantCulture);
        var productUrl = $"{frontendBase.TrimEnd('/')}/products/{slug}";
        var imageUrl = ResolveProductEmailImageUrl(product);
        if (imageUrl == null && string.IsNullOrWhiteSpace(GetPublicBaseUrl()))
        {
            _logger.LogInformation(
                "Product launch emails for product {ProductId} will use the Cairo Bags placeholder (PublicBaseUrl is not configured).",
                productId);
        }

        var categoryName = product.Category.Translations
            .FirstOrDefault(t => t.LanguageCode == "en")?.Name
            ?? product.Category.Translations.FirstOrDefault()?.Name
            ?? "Bags";
        var price = FormatPrice(product);
        var shortDesc = enTranslation?.ShortDescription ?? enTranslation?.Description ?? "";
        var productName = enTranslation?.Name ?? "New Product";

        foreach (var subscriber in subscribers)
        {
            var lang = subscriber.Language == "ar" ? "ar" : "en";
            var translation = product.Translations.FirstOrDefault(t => t.LanguageCode == lang) ?? enTranslation;
            var localizedName = translation?.Name ?? productName;
            var localizedDesc = translation?.ShortDescription ?? translation?.Description ?? shortDesc;
            var localizedCategory = product.Category.Translations
                .FirstOrDefault(t => t.LanguageCode == lang)?.Name ?? categoryName;
            var localizedSlug = translation?.Slug ?? slug;
            var localizedUrl = $"{frontendBase.TrimEnd('/')}/products/{localizedSlug}";
            var unsubscribeUrl = BuildUnsubscribeUrl(subscriber.UnsubscribeToken);

            var (subject, html) = NewsletterEmailTemplates.BuildProductLaunchEmail(
                localizedName,
                price,
                localizedCategory,
                localizedDesc,
                imageUrl ?? string.Empty,
                localizedUrl,
                unsubscribeUrl);

            var job = new NewsletterEmailJob
            {
                SubscriberId = subscriber.Id,
                ToEmail = subscriber.Email,
                EmailType = NewsletterEmailType.ProductLaunch,
                ProductId = productId,
                Subject = subject,
                HtmlBody = html,
                Status = NewsletterEmailStatus.Pending,
                CreatedAt = DateTime.UtcNow,
            };
            _context.NewsletterEmailJobs.Add(job);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var jobIds = await _context.NewsletterEmailJobs
            .Where(j => j.ProductId == productId && j.EmailType == NewsletterEmailType.ProductLaunch && j.Status == NewsletterEmailStatus.Pending)
            .Select(j => j.Id)
            .ToListAsync(cancellationToken);

        foreach (var jobId in jobIds)
            _emailQueue.Enqueue(jobId);

        _logger.LogInformation("Enqueued {Count} product launch emails for product {ProductId}.", jobIds.Count, productId);
    }

    public async Task<NewsletterStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var totalSubscribers = await _context.NewsletterSubscribers.CountAsync(s => s.IsSubscribed, cancellationToken);
        var subscribedToday = await _context.NewsletterSubscribers
            .CountAsync(s => s.IsSubscribed && s.SubscribedAt >= today && s.SubscribedAt < tomorrow, cancellationToken);
        var unsubscribed = await _context.NewsletterSubscribers.CountAsync(s => !s.IsSubscribed, cancellationToken);
        var emailsSent = await _context.NewsletterEmailJobs.CountAsync(j => j.Status == NewsletterEmailStatus.Sent, cancellationToken);

        var lastCampaign = await _context.ProductLaunchNotifications
            .AsNoTracking()
            .OrderByDescending(n => n.SentAt)
            .FirstOrDefaultAsync(cancellationToken);

        ProductLaunchCampaignDto? campaignDto = null;
        if (lastCampaign != null)
        {
            var productName = await _context.ProductTranslations
                .AsNoTracking()
                .Where(t => t.ProductId == lastCampaign.ProductId && t.LanguageCode == "en")
                .Select(t => t.Name)
                .FirstOrDefaultAsync(cancellationToken);

            campaignDto = new ProductLaunchCampaignDto
            {
                ProductId = lastCampaign.ProductId,
                ProductName = productName,
                SentAt = lastCampaign.SentAt,
                RecipientCount = lastCampaign.RecipientCount,
            };
        }

        return new NewsletterStatsDto
        {
            TotalSubscribers = totalSubscribers,
            SubscribedToday = subscribedToday,
            Unsubscribed = unsubscribed,
            EmailsSent = emailsSent,
            LastCampaign = campaignDto,
        };
    }

    public async Task<PagedNewsletterSubscribersDto> GetSubscribersAsync(
        AdminNewsletterFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize is < 1 or > 100 ? 20 : filter.PageSize;
        var search = (filter.Search ?? string.Empty).Trim().ToLowerInvariant();

        var query = _context.NewsletterSubscribers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.Email.Contains(search));

        if (filter.IsSubscribed.HasValue)
            query = query.Where(s => s.IsSubscribed == filter.IsSubscribed.Value);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(s => s.SubscribedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new NewsletterSubscriberDto
            {
                Id = s.Id,
                Email = s.Email,
                IsSubscribed = s.IsSubscribed,
                SubscribedAt = s.SubscribedAt,
                UnsubscribedAt = s.UnsubscribedAt,
                LastEmailSentAt = s.LastEmailSentAt,
                Language = s.Language,
                CreatedAt = s.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        return new PagedNewsletterSubscribersDto
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<byte[]> ExportSubscribersCsvAsync(
        AdminNewsletterFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var rows = await GetExportRowsAsync(filter, cancellationToken);
        var sb = new StringBuilder();
        sb.AppendLine("Email,IsSubscribed,SubscribedAt,UnsubscribedAt,LastEmailSentAt,Language,CreatedAt");
        foreach (var row in rows)
        {
            sb.Append(EscapeCsv(row.Email)).Append(',')
                .Append(row.IsSubscribed ? "true" : "false").Append(',')
                .Append(row.SubscribedAt.ToString("o", CultureInfo.InvariantCulture)).Append(',')
                .Append(row.UnsubscribedAt?.ToString("o", CultureInfo.InvariantCulture) ?? "").Append(',')
                .Append(row.LastEmailSentAt?.ToString("o", CultureInfo.InvariantCulture) ?? "").Append(',')
                .Append(row.Language).Append(',')
                .Append(row.CreatedAt.ToString("o", CultureInfo.InvariantCulture))
                .AppendLine();
        }

        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }

    public Task<byte[]> ExportSubscribersExcelAsync(
        AdminNewsletterFilterDto filter,
        CancellationToken cancellationToken = default) =>
        ExportSubscribersCsvAsync(filter, cancellationToken);

    private async Task EnqueueWelcomeEmailAsync(NewsletterSubscriber subscriber, CancellationToken cancellationToken)
    {
        var shopUrl = GetFrontendBaseUrl().TrimEnd('/');
        var unsubscribeUrl = BuildUnsubscribeUrl(subscriber.UnsubscribeToken);
        var (subject, html) = NewsletterEmailTemplates.BuildWelcomeEmail(shopUrl, unsubscribeUrl);

        var job = new NewsletterEmailJob
        {
            SubscriberId = subscriber.Id,
            ToEmail = subscriber.Email,
            EmailType = NewsletterEmailType.Welcome,
            Subject = subject,
            HtmlBody = html,
            Status = NewsletterEmailStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

        _context.NewsletterEmailJobs.Add(job);
        await _context.SaveChangesAsync(cancellationToken);
        _emailQueue.Enqueue(job.Id);
    }

    private async Task<List<NewsletterSubscriberDto>> GetExportRowsAsync(
        AdminNewsletterFilterDto filter,
        CancellationToken cancellationToken)
    {
        var search = (filter.Search ?? string.Empty).Trim().ToLowerInvariant();
        var query = _context.NewsletterSubscribers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.Email.Contains(search));

        if (filter.IsSubscribed.HasValue)
            query = query.Where(s => s.IsSubscribed == filter.IsSubscribed.Value);

        return await query
            .OrderByDescending(s => s.SubscribedAt)
            .Take(ExportMaxRows)
            .Select(s => new NewsletterSubscriberDto
            {
                Id = s.Id,
                Email = s.Email,
                IsSubscribed = s.IsSubscribed,
                SubscribedAt = s.SubscribedAt,
                UnsubscribedAt = s.UnsubscribedAt,
                LastEmailSentAt = s.LastEmailSentAt,
                Language = s.Language,
                CreatedAt = s.CreatedAt,
            })
            .ToListAsync(cancellationToken);
    }

    private string GetFrontendBaseUrl() =>
        _config["App:FrontendBaseUrl"]?.Trim() ?? "http://localhost:3000";

    private string? GetPublicBaseUrl() =>
        _config["PublicBaseUrl"]?.Trim()
        ?? _config["App:PublicBaseUrl"]?.Trim();

    private string? ResolveProductEmailImageUrl(Product product)
    {
        var publicBase = GetPublicBaseUrl();
        if (string.IsNullOrWhiteSpace(publicBase))
            return null;

        var primary = product.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .FirstOrDefault();

        var path = primary?.ImageUrl;
        if (string.IsNullOrWhiteSpace(path))
            return null;

        if (path.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return path.Trim();

        var normalizedPath = path.StartsWith('/') ? path : $"/{path}";
        return $"{publicBase.TrimEnd('/')}{normalizedPath}";
    }

    private string BuildUnsubscribeUrl(string token) =>
        $"{GetFrontendBaseUrl().TrimEnd('/')}/newsletter/unsubscribe?token={Uri.EscapeDataString(token)}";

    private static string FormatPrice(Product product)
    {
        var prices = product.Variants.Where(v => v.Status == VariantStatus.Active).Select(v => v.Price).ToList();
        if (prices.Count == 0)
            return "—";

        var min = prices.Min();
        var max = prices.Max();
        return min == max
            ? $"EGP {min:N0}"
            : $"EGP {min:N0} – EGP {max:N0}";
    }

    private static string NormalizeEmail(string email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    private static string NormalizeLanguage(string? language)
    {
        var lang = (language ?? "en").Trim().ToLowerInvariant();
        return lang == "ar" ? "ar" : "en";
    }

    private static string GenerateToken() => Guid.NewGuid().ToString("N");

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 320)
            return false;

        try
        {
            var addr = new MailAddress(email);
            return addr.Address.Equals(email, StringComparison.OrdinalIgnoreCase) && EmailRegex().IsMatch(email);
        }
        catch
        {
            return false;
        }
    }

    private static string EscapeCsv(string value)
    {
        if (value.Contains('"') || value.Contains(',') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex EmailRegex();
}
