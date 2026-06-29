using CairoBags.Data;
using CairoBags.Models;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CairoBags.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly CairoBagsContext _context;
        private readonly NotificationService _notificationService;

        public NotificationsController(CairoBagsContext context, NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

        /// <summary>Lists notifications for the authenticated user only (UserId from JWT).</summary>
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 100) pageSize = 20;

            var query = _context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId && !n.IsArchived)
                .OrderByDescending(n => n.CreatedAtUtc);

            var total = await query.CountAsync();
            var rows = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = rows.Select(NotificationService.ToDto).ToList();

            var result = new
            {
                total,
                page,
                pageSize,
                items
            };

            return Ok(result);
        }

        /// <summary>Marks a notification read only when it belongs to the authenticated user.</summary>
        [HttpPost("read/{id:int}")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
            {
                return NotFound();
            }

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
                await _notificationService.BroadcastUnreadCountAsync(userId, HttpContext.RequestAborted);
            }

            return NoContent();
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead && !n.IsArchived)
                .ToListAsync();

            if (notifications.Count == 0)
            {
                return NoContent();
            }

            foreach (var n in notifications)
            {
                n.IsRead = true;
            }

            await _context.SaveChangesAsync();

            await _notificationService.BroadcastUnreadCountAsync(userId, HttpContext.RequestAborted);

            return NoContent();
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var count = await _context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId && !n.IsRead && !n.IsArchived)
                .CountAsync();

            return Ok(new { count });
        }
    }
}
