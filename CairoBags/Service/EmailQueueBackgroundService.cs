using CairoBags.Data;
using CairoBags.Models.Marketing;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class EmailQueueBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly EmailQueue _emailQueue;
    private readonly ILogger<EmailQueueBackgroundService> _logger;

    public EmailQueueBackgroundService(
        IServiceScopeFactory scopeFactory,
        EmailQueue emailQueue,
        ILogger<EmailQueueBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _emailQueue = emailQueue;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RequeuePendingJobsAsync(stoppingToken);

        await foreach (var jobId in _emailQueue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await ProcessJobAsync(jobId, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error processing email job {JobId}", jobId);
            }
        }
    }

    private async Task RequeuePendingJobsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CairoBagsContext>();

        var pendingIds = await context.NewsletterEmailJobs
            .AsNoTracking()
            .Where(j => j.Status == NewsletterEmailStatus.Pending)
            .OrderBy(j => j.CreatedAt)
            .Select(j => j.Id)
            .ToListAsync(cancellationToken);

        foreach (var id in pendingIds)
            _emailQueue.Enqueue(id);

        if (pendingIds.Count > 0)
            _logger.LogInformation("Requeued {Count} pending newsletter email jobs.", pendingIds.Count);
    }

    private async Task ProcessJobAsync(int jobId, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CairoBagsContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var job = await context.NewsletterEmailJobs
            .FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken);

        if (job == null || job.Status == NewsletterEmailStatus.Sent)
            return;

        job.Status = NewsletterEmailStatus.Processing;
        job.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        try
        {
            await emailService.SendAsync(job.ToEmail, job.Subject, job.HtmlBody);
            job.Status = NewsletterEmailStatus.Sent;
            job.SentAt = DateTime.UtcNow;
            job.Error = null;
            job.UpdatedAt = DateTime.UtcNow;

            if (job.SubscriberId.HasValue)
            {
                var subscriber = await context.NewsletterSubscribers
                    .FirstOrDefaultAsync(s => s.Id == job.SubscriberId.Value, cancellationToken);
                if (subscriber != null)
                {
                    subscriber.LastEmailSentAt = job.SentAt;
                    subscriber.UpdatedAt = DateTime.UtcNow;
                }
            }

            await context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            job.Retries += 1;
            job.Error = ex.Message.Length > 2000 ? ex.Message[..2000] : ex.Message;
            job.UpdatedAt = DateTime.UtcNow;

            if (job.Retries < 3)
            {
                job.Status = NewsletterEmailStatus.Pending;
                await context.SaveChangesAsync(cancellationToken);
                await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, job.Retries)), cancellationToken);
                _emailQueue.Enqueue(job.Id);
                _logger.LogWarning(ex, "Email job {JobId} failed (retry {Retry}). Requeued.", job.Id, job.Retries);
            }
            else
            {
                job.Status = NewsletterEmailStatus.Failed;
                await context.SaveChangesAsync(cancellationToken);
                _logger.LogError(ex, "Email job {JobId} failed permanently after {Retries} retries.", job.Id, job.Retries);
            }
        }
    }
}
