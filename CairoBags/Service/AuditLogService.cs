using System.Text.Json;
using CairoBags.Data;
using CairoBags.Models.System;

namespace CairoBags.Service;

public class AuditLogService
{
    private readonly CairoBagsContext _context;

    public AuditLogService(CairoBagsContext context)
    {
        _context = context;
    }

    public async Task TryLogOrderStatusChangeAsync(
        string adminUserId,
        int orderId,
        string orderNumber,
        string oldStatus,
        string newStatus,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var now = DateTime.UtcNow;
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = adminUserId,
                EntityName = "Order",
                EntityId = orderId.ToString(),
                Action = AuditAction.Update,
                OldValues = JsonSerializer.Serialize(new
                {
                    orderNumber,
                    status = oldStatus,
                }),
                NewValues = JsonSerializer.Serialize(new
                {
                    orderNumber,
                    status = newStatus,
                    change = $"{oldStatus} -> {newStatus}",
                }),
                CreatedAt = now,
                CreatedBy = adminUserId,
            });

            await _context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // Audit logging must never block order management.
        }
    }
}
