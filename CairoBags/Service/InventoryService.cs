using CairoBags.Data;
using CairoBags.Dto.Inventory;
using CairoBags.Dto.Store;
using CairoBags.Hubs;
using CairoBags.Models.Catalog;
using CairoBags.Models.Inventories;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class InventoryService : IInventoryService
{
    private readonly CairoBagsContext _context;
    private readonly NotificationService _notificationService;
    private readonly IStoreUpdateBroadcastService _storeBroadcast;

    public InventoryService(
        CairoBagsContext context,
        NotificationService notificationService,
        IStoreUpdateBroadcastService storeBroadcast)
    {
        _context = context;
        _notificationService = notificationService;
        _storeBroadcast = storeBroadcast;
    }

    public async Task<IReadOnlyList<InventoryListItemDto>> GetInventoryListAsync(CancellationToken cancellationToken = default)
    {
        var inventories = await QueryInventories()
            .OrderBy(i => i.ProductVariant.ProductId)
            .ThenBy(i => i.ProductVariantId)
            .ToListAsync(cancellationToken);

        return inventories.Select(MapListItem).ToList();
    }

    public async Task<InventoryDetailsDto?> GetInventoryByVariantIdAsync(int variantId, CancellationToken cancellationToken = default)
    {
        var inventory = await QueryInventories()
            .FirstOrDefaultAsync(i => i.ProductVariantId == variantId, cancellationToken);

        return inventory == null ? null : MapDetails(inventory);
    }

    public async Task<IReadOnlyList<InventoryListItemDto>> GetLowStockProductsAsync(CancellationToken cancellationToken = default)
    {
        var inventories = await QueryInventories()
            .ToListAsync(cancellationToken);

        return inventories
            .Select(MapListItem)
            .Where(i => i.IsLowStock)
            .OrderBy(i => i.AvailableStock)
            .ThenBy(i => i.ProductVariantId)
            .ToList();
    }

    public async Task<IReadOnlyList<InventoryMovementDto>> GetMovementHistoryAsync(int variantId, CancellationToken cancellationToken = default)
    {
        var inventoryId = await _context.Inventories
            .AsNoTracking()
            .Where(i => i.ProductVariantId == variantId)
            .Select(i => (int?)i.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!inventoryId.HasValue)
            return Array.Empty<InventoryMovementDto>();

        var movements = await _context.InventoryMovements
            .AsNoTracking()
            .Where(m => m.InventoryId == inventoryId.Value)
            .OrderByDescending(m => m.CreatedAt)
            .ThenByDescending(m => m.Id)
            .ToListAsync(cancellationToken);

        return movements.Select(MapMovement).ToList();
    }

    public async Task<InventoryStatusDto?> GetInventoryStatusAsync(int variantId, CancellationToken cancellationToken = default)
    {
        var variant = await _context.ProductVariants
            .AsNoTracking()
            .Include(v => v.Inventory)
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v =>
                v.Id == variantId &&
                v.Status == VariantStatus.Active &&
                !v.Product.IsDeleted &&
                v.Product.Status == ProductStatus.Active,
                cancellationToken);

        if (variant?.Inventory == null)
            return null;

        var available = CalculateAvailableStock(variant.Inventory);
        return new InventoryStatusDto
        {
            ProductVariantId = variant.Id,
            ProductId = variant.ProductId,
            AvailableStock = available,
            IsInStock = available > 0
        };
    }

    public Task<ServiceResult<InventoryDetailsDto>> AdjustStockAsync(
        int variantId,
        AdjustStockRequest request,
        string? userId,
        CancellationToken cancellationToken = default) =>
        ExecuteInventoryMutationAsync(
            variantId,
            (inventory, now) =>
            {
                if (request.Quantity == 0)
                    return Task.FromResult<ServiceResult<InventoryDetailsDto>?>(
                        ServiceResult<InventoryDetailsDto>.Fail("invalid_quantity", "Adjustment quantity cannot be zero."));

                var newOnHand = inventory.QuantityOnHand + request.Quantity;
                if (newOnHand < 0)
                    return Task.FromResult<ServiceResult<InventoryDetailsDto>?>(
                        ServiceResult<InventoryDetailsDto>.Fail("insufficient_stock", "Cannot reduce stock below zero."));

                if (newOnHand < inventory.QuantityReserved)
                    return Task.FromResult<ServiceResult<InventoryDetailsDto>?>(
                        ServiceResult<InventoryDetailsDto>.Fail("insufficient_stock", "Cannot reduce stock below reserved quantity."));

                inventory.QuantityOnHand = newOnHand;
                inventory.UpdatedAt = now;
                inventory.UpdatedBy = userId;

                AddMovement(inventory, InventoryMovementType.Adjustment, request.Quantity, request.Notes, request.ReferenceNumber, now, userId);
                return Task.FromResult<ServiceResult<InventoryDetailsDto>?>(null);
            },
            userId,
            cancellationToken);

    public Task<ServiceResult<InventoryDetailsDto>> ReserveStockAsync(
        int variantId,
        StockQuantityRequest request,
        string? userId,
        CancellationToken cancellationToken = default) =>
        ExecuteInventoryMutationAsync(
            variantId,
            (inventory, now) =>
            {
                if (request.Quantity <= 0)
                    return Task.FromResult<ServiceResult<InventoryDetailsDto>?>(
                        ServiceResult<InventoryDetailsDto>.Fail("invalid_quantity", "Reserve quantity must be greater than zero."));

                var available = CalculateAvailableStock(inventory);
                if (request.Quantity > available)
                    return Task.FromResult<ServiceResult<InventoryDetailsDto>?>(
                        ServiceResult<InventoryDetailsDto>.Fail("insufficient_stock", "Cannot reserve more than available stock."));

                inventory.QuantityReserved += request.Quantity;
                inventory.UpdatedAt = now;
                inventory.UpdatedBy = userId;

                AddMovement(inventory, InventoryMovementType.Reservation, request.Quantity, request.Notes, request.ReferenceNumber, now, userId);
                return Task.FromResult<ServiceResult<InventoryDetailsDto>?>(null);
            },
            userId,
            cancellationToken);

    public Task<ServiceResult<InventoryDetailsDto>> ReleaseReservationAsync(
        int variantId,
        StockQuantityRequest request,
        string? userId,
        CancellationToken cancellationToken = default) =>
        ExecuteInventoryMutationAsync(
            variantId,
            (inventory, now) =>
            {
                if (request.Quantity <= 0)
                    return Task.FromResult<ServiceResult<InventoryDetailsDto>?>(
                        ServiceResult<InventoryDetailsDto>.Fail("invalid_quantity", "Release quantity must be greater than zero."));

                if (request.Quantity > inventory.QuantityReserved)
                    return Task.FromResult<ServiceResult<InventoryDetailsDto>?>(
                        ServiceResult<InventoryDetailsDto>.Fail("invalid_release", "Cannot release more than reserved quantity."));

                inventory.QuantityReserved -= request.Quantity;
                inventory.UpdatedAt = now;
                inventory.UpdatedBy = userId;

                AddMovement(inventory, InventoryMovementType.ReleaseReservation, request.Quantity, request.Notes, request.ReferenceNumber, now, userId);
                return Task.FromResult<ServiceResult<InventoryDetailsDto>?>(null);
            },
            userId,
            cancellationToken);

    private async Task<ServiceResult<InventoryDetailsDto>> ExecuteInventoryMutationAsync(
        int variantId,
        Func<Models.Inventories.Inventory, DateTime, Task<ServiceResult<InventoryDetailsDto>?>> mutate,
        string? userId,
        CancellationToken cancellationToken)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var inventory = await _context.Inventories
                .Include(i => i.ProductVariant)
                .ThenInclude(v => v.Product)
                .ThenInclude(p => p.Translations)
                .FirstOrDefaultAsync(i => i.ProductVariantId == variantId, cancellationToken);

            if (inventory == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<InventoryDetailsDto>.Fail("not_found", "Inventory not found.", StatusCodes.Status404NotFound);
            }

            var now = DateTime.UtcNow;
            var validationResult = await mutate(inventory, now);
            if (validationResult != null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return validationResult;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var details = MapDetails(inventory);
            if (!details.IsLowStock)
            {
                await _notificationService.ArchiveLowStockNotificationsForVariantAsync(
                    variantId,
                    cancellationToken);
            }

            await _storeBroadcast.BroadcastStorefrontAsync(
                StoreUpdateEvents.InventoryUpdated,
                new StoreUpdatePayloadDto
                {
                    EntityId = variantId,
                    VariantId = variantId,
                    ProductId = inventory.ProductVariant.ProductId,
                    AvailableStock = details.AvailableStock,
                    IsInStock = details.AvailableStock > 0,
                },
                cancellationToken);

            return ServiceResult<InventoryDetailsDto>.Ok(details);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ServiceResult<InventoryDetailsDto>.Fail(
                "concurrency_conflict",
                "Inventory was updated by another process. Please retry.",
                StatusCodes.Status409Conflict);
        }
    }

    private IQueryable<Models.Inventories.Inventory> QueryInventories() =>
        _context.Inventories
            .AsNoTracking()
            .Include(i => i.ProductVariant)
            .ThenInclude(v => v.Product)
            .ThenInclude(p => p.Translations)
            .Where(i => !i.ProductVariant.Product.IsDeleted);

    private static void AddMovement(
        Models.Inventories.Inventory inventory,
        InventoryMovementType type,
        int quantity,
        string? notes,
        string? referenceNumber,
        DateTime createdAt,
        string? userId)
    {
        inventory.Movements.Add(new InventoryMovement
        {
            Type = type,
            Quantity = quantity,
            Notes = NormalizeOptional(notes),
            ReferenceNumber = NormalizeOptional(referenceNumber),
            CreatedAt = createdAt,
            CreatedBy = userId
        });
    }

    private static int CalculateAvailableStock(Models.Inventories.Inventory inventory) =>
        Math.Max(0, inventory.QuantityOnHand - inventory.QuantityReserved);

    private static InventoryListItemDto MapListItem(Models.Inventories.Inventory inventory)
    {
        var available = CalculateAvailableStock(inventory);
        var variant = inventory.ProductVariant;
        var product = variant.Product;

        return new InventoryListItemDto
        {
            InventoryId = inventory.Id,
            ProductVariantId = inventory.ProductVariantId,
            ProductId = variant.ProductId,
            Sku = variant.Sku,
            ProductNameEn = product.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Name,
            ProductNameAr = product.Translations.FirstOrDefault(t => t.LanguageCode == "ar")?.Name,
            ColorNameEn = variant.ColorNameEn,
            ColorNameAr = variant.ColorNameAr,
            QuantityOnHand = inventory.QuantityOnHand,
            QuantityReserved = inventory.QuantityReserved,
            AvailableStock = available,
            LowStockThreshold = inventory.LowStockThreshold,
            IsLowStock = available <= inventory.LowStockThreshold,
            IsInStock = available > 0
        };
    }

    private static InventoryDetailsDto MapDetails(Models.Inventories.Inventory inventory)
    {
        var summary = MapListItem(inventory);
        return new InventoryDetailsDto
        {
            InventoryId = summary.InventoryId,
            ProductVariantId = summary.ProductVariantId,
            ProductId = summary.ProductId,
            Sku = summary.Sku,
            ProductNameEn = summary.ProductNameEn,
            ProductNameAr = summary.ProductNameAr,
            ColorNameEn = summary.ColorNameEn,
            ColorNameAr = summary.ColorNameAr,
            QuantityOnHand = summary.QuantityOnHand,
            QuantityReserved = summary.QuantityReserved,
            AvailableStock = summary.AvailableStock,
            LowStockThreshold = summary.LowStockThreshold,
            IsLowStock = summary.IsLowStock,
            IsInStock = summary.IsInStock,
            CreatedAt = inventory.CreatedAt,
            UpdatedAt = inventory.UpdatedAt
        };
    }

    private static InventoryMovementDto MapMovement(InventoryMovement movement) =>
        new()
        {
            Id = movement.Id,
            Type = InventoryMovementTypeNames.ToApiString(movement.Type),
            Quantity = movement.Quantity,
            Notes = movement.Notes,
            ReferenceNumber = movement.ReferenceNumber,
            CreatedAt = movement.CreatedAt
        };

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
