using CairoBags.Data;
using CairoBags.Dto.Shipping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Controllers;

[ApiController]
[Route("api/governorates")]
public class GovernoratesController : ControllerBase
{
    private readonly CairoBagsContext _context;

    public GovernoratesController(CairoBagsContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var items = await _context.Governorates
            .AsNoTracking()
            .Where(g => g.IsSelectable)
            .OrderBy(g => g.DisplayOrder)
            .ThenBy(g => g.NameEn)
            .Select(g => new GovernorateListItemDto
            {
                Id = g.Id,
                NameEn = g.NameEn,
                NameAr = g.NameAr,
                ShippingFee = g.ShippingFee,
            })
            .ToListAsync(cancellationToken);

        return Ok(items);
    }
}
