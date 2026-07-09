using CairoBags.Data;
using CairoBags.Dto.Orders;
using CairoBags.Models.Orders;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Controllers;

[ApiController]
[Route("api/shipping-addresses")]
[Authorize]
public class ShippingAddressController : ControllerBase
{
    private readonly CairoBagsContext _context;
    private readonly UserManager<Models.Identity.ApplicationUser> _userManager;
    private readonly IShippingFeeService _shippingFeeService;

    public ShippingAddressController(
        CairoBagsContext context,
        UserManager<Models.Identity.ApplicationUser> userManager,
        IShippingFeeService shippingFeeService)
    {
        _context = context;
        _userManager = userManager;
        _shippingFeeService = shippingFeeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyAddresses(CancellationToken cancellationToken)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null) return Unauthorized();

        var addresses = await _context.ShippingAddresses
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.UpdatedAt ?? a.CreatedAt)
            .Select(a => MapToDto(a))
            .ToListAsync(cancellationToken);

        return Ok(addresses);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAddress(
        [FromBody] CreateShippingAddressRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = _userManager.GetUserId(User);
        if (userId == null) return Unauthorized();

        var governorateError = await ValidateGovernorateAsync(request.Governorate, cancellationToken);
        if (governorateError != null) return governorateError;

        var now = DateTime.UtcNow;

        if (request.IsDefault)
        {
            await ClearDefaultAddressesAsync(userId, now, cancellationToken);
        }

        var hasAny = await _context.ShippingAddresses.AnyAsync(a => a.UserId == userId, cancellationToken);
        var entity = new ShippingAddress
        {
            UserId = userId,
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            Governorate = request.Governorate.Trim(),
            City = request.City.Trim(),
            AddressLine1 = request.AddressLine1.Trim(),
            AddressLine2 = string.IsNullOrWhiteSpace(request.AddressLine2) ? null : request.AddressLine2.Trim(),
            PostalCode = string.IsNullOrWhiteSpace(request.PostalCode) ? null : request.PostalCode.Trim(),
            IsDefault = request.IsDefault || !hasAny,
            CreatedAt = now,
            CreatedBy = userId,
        };

        _context.ShippingAddresses.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToDto(entity));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateAddress(
        int id,
        [FromBody] UpdateShippingAddressRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = _userManager.GetUserId(User);
        if (userId == null) return Unauthorized();

        var entity = await _context.ShippingAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, cancellationToken);

        if (entity == null)
            return NotFound();

        var governorateError = await ValidateGovernorateAsync(request.Governorate, cancellationToken);
        if (governorateError != null) return governorateError;

        var now = DateTime.UtcNow;

        if (request.IsDefault && !entity.IsDefault)
        {
            await ClearDefaultAddressesAsync(userId, now, cancellationToken);
        }

        entity.FullName = request.FullName.Trim();
        entity.PhoneNumber = request.PhoneNumber.Trim();
        entity.Governorate = request.Governorate.Trim();
        entity.City = request.City.Trim();
        entity.AddressLine1 = request.AddressLine1.Trim();
        entity.AddressLine2 = string.IsNullOrWhiteSpace(request.AddressLine2) ? null : request.AddressLine2.Trim();
        entity.PostalCode = string.IsNullOrWhiteSpace(request.PostalCode) ? null : request.PostalCode.Trim();
        entity.IsDefault = request.IsDefault;
        entity.UpdatedAt = now;
        entity.UpdatedBy = userId;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToDto(entity));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAddress(int id, CancellationToken cancellationToken)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null) return Unauthorized();

        var entity = await _context.ShippingAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, cancellationToken);

        if (entity == null)
            return NotFound();

        var wasDefault = entity.IsDefault;
        _context.ShippingAddresses.Remove(entity);

        if (wasDefault)
        {
            var nextDefault = await _context.ShippingAddresses
                .Where(a => a.UserId == userId && a.Id != id)
                .OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (nextDefault != null)
            {
                nextDefault.IsDefault = true;
                nextDefault.UpdatedAt = DateTime.UtcNow;
                nextDefault.UpdatedBy = userId;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task ClearDefaultAddressesAsync(
        string userId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var existingDefaults = await _context.ShippingAddresses
            .Where(a => a.UserId == userId && a.IsDefault)
            .ToListAsync(cancellationToken);

        foreach (var address in existingDefaults)
        {
            address.IsDefault = false;
            address.UpdatedAt = now;
        }
    }

    private async Task<IActionResult?> ValidateGovernorateAsync(
        string governorate,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(governorate))
        {
            return BadRequest(new
            {
                code = "governorate_required",
                message = "Please select your governorate."
            });
        }

        if (!await _shippingFeeService.IsKnownGovernorateAsync(governorate.Trim(), cancellationToken))
        {
            return BadRequest(new
            {
                code = "shipping_unavailable",
                message = "Shipping is currently unavailable for the selected governorate. Please choose another governorate or contact support."
            });
        }

        return null;
    }

    private static ShippingAddressDto MapToDto(ShippingAddress address) => new()
    {
        Id = address.Id,
        FullName = address.FullName,
        PhoneNumber = address.PhoneNumber,
        Governorate = address.Governorate,
        City = address.City,
        AddressLine1 = address.AddressLine1,
        AddressLine2 = address.AddressLine2,
        PostalCode = address.PostalCode,
        IsDefault = address.IsDefault,
    };
}
