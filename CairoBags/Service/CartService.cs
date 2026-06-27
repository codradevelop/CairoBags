using CairoBags.Data;
using CairoBags.Dto.Commerce;
using CairoBags.Models.Catalog;
using CairoBags.Models.Commerce;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class CartService : ICartService
{
    private readonly CairoBagsContext _context;

    public CartService(CairoBagsContext context)
    {
        _context = context;
    }

    public Task<ServiceResult<CartDto>> GetCartAsync(
        string? userId,
        string? sessionId,
        CancellationToken cancellationToken = default) =>
        BuildCartResponseAsync(userId, sessionId, revalidateStock: true, createIfMissing: false, cancellationToken);

    public async Task<ServiceResult<CartDto>> AddItemAsync(
        string? userId,
        string? sessionId,
        AddCartItemRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Quantity <= 0)
            return ServiceResult<CartDto>.Fail("invalid_quantity", "Quantity must be greater than zero.");

        var identity = ResolveIdentity(userId, sessionId);
        if (identity == null)
            return ServiceResult<CartDto>.Fail("cart_identity_required", "Authentication or SessionId is required.", StatusCodes.Status401Unauthorized);

        var variantResult = await LoadActiveVariantAsync(request.ProductVariantId, cancellationToken);
        if (variantResult.Error != null)
            return ServiceResult<CartDto>.Fail(variantResult.Error.ErrorCode, variantResult.Error.Message, variantResult.Error.StatusCode);

        var variant = variantResult.Variant!;
        var available = GetAvailableStock(variant);

        var cart = await GetOrCreateCartAsync(identity.UserId, identity.SessionId, cancellationToken);
        var existingItem = cart.Items.FirstOrDefault(i => i.ProductVariantId == variant.Id);
        var newQuantity = (existingItem?.Quantity ?? 0) + request.Quantity;

        if (newQuantity > available)
        {
            return ServiceResult<CartDto>.Fail(
                "insufficient_stock",
                $"Only {available} item(s) available in stock.");
        }

        var now = DateTime.UtcNow;
        if (existingItem != null)
        {
            existingItem.Quantity = newQuantity;
            existingItem.UnitPrice = variant.Price;
            existingItem.UpdatedAt = now;
        }
        else
        {
            cart.Items.Add(new CartItem
            {
                ProductVariantId = variant.Id,
                Quantity = request.Quantity,
                UnitPrice = variant.Price,
                CreatedAt = now
            });
        }

        TouchCart(cart, now);
        await _context.SaveChangesAsync(cancellationToken);

        return await BuildCartResponseAsync(userId, sessionId, revalidateStock: false, createIfMissing: false, cancellationToken);
    }

    public async Task<ServiceResult<CartDto>> UpdateItemQuantityAsync(
        string? userId,
        string? sessionId,
        int variantId,
        UpdateCartItemRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Quantity <= 0)
            return ServiceResult<CartDto>.Fail("invalid_quantity", "Quantity must be greater than zero.");

        var identity = ResolveIdentity(userId, sessionId);
        if (identity == null)
            return ServiceResult<CartDto>.Fail("cart_identity_required", "Authentication or SessionId is required.", StatusCodes.Status401Unauthorized);

        var cart = await LoadCartAsync(identity.UserId, identity.SessionId, cancellationToken);
        if (cart == null)
            return ServiceResult<CartDto>.Fail("cart_not_found", "Cart not found.", StatusCodes.Status404NotFound);

        var item = cart.Items.FirstOrDefault(i => i.ProductVariantId == variantId);
        if (item == null)
            return ServiceResult<CartDto>.Fail("item_not_found", "Cart item not found.", StatusCodes.Status404NotFound);

        var variantResult = await LoadActiveVariantAsync(variantId, cancellationToken);
        if (variantResult.Error != null)
            return ServiceResult<CartDto>.Fail(variantResult.Error.ErrorCode, variantResult.Error.Message, variantResult.Error.StatusCode);

        var available = GetAvailableStock(variantResult.Variant!);
        if (request.Quantity > available)
        {
            return ServiceResult<CartDto>.Fail(
                "insufficient_stock",
                $"Only {available} item(s) available in stock.");
        }

        var now = DateTime.UtcNow;
        item.Quantity = request.Quantity;
        item.UnitPrice = variantResult.Variant!.Price;
        item.UpdatedAt = now;
        TouchCart(cart, now);

        await _context.SaveChangesAsync(cancellationToken);
        return await BuildCartResponseAsync(userId, sessionId, revalidateStock: false, createIfMissing: false, cancellationToken);
    }

    public async Task<ServiceResult<CartDto>> RemoveItemAsync(
        string? userId,
        string? sessionId,
        int variantId,
        CancellationToken cancellationToken = default)
    {
        var identity = ResolveIdentity(userId, sessionId);
        if (identity == null)
            return ServiceResult<CartDto>.Fail("cart_identity_required", "Authentication or SessionId is required.", StatusCodes.Status401Unauthorized);

        var cart = await LoadCartAsync(identity.UserId, identity.SessionId, cancellationToken);
        if (cart == null)
            return ServiceResult<CartDto>.Fail("cart_not_found", "Cart not found.", StatusCodes.Status404NotFound);

        var item = cart.Items.FirstOrDefault(i => i.ProductVariantId == variantId);
        if (item == null)
            return ServiceResult<CartDto>.Fail("item_not_found", "Cart item not found.", StatusCodes.Status404NotFound);

        _context.CartItems.Remove(item);
        TouchCart(cart, DateTime.UtcNow);
        await _context.SaveChangesAsync(cancellationToken);

        return await BuildCartResponseAsync(userId, sessionId, revalidateStock: false, createIfMissing: false, cancellationToken);
    }

    public async Task<ServiceResult<CartDto>> ClearCartAsync(
        string? userId,
        string? sessionId,
        CancellationToken cancellationToken = default)
    {
        var identity = ResolveIdentity(userId, sessionId);
        if (identity == null)
            return ServiceResult<CartDto>.Fail("cart_identity_required", "Authentication or SessionId is required.", StatusCodes.Status401Unauthorized);

        var cart = await LoadCartAsync(identity.UserId, identity.SessionId, cancellationToken);
        if (cart == null)
            return ServiceResult<CartDto>.Ok(CreateEmptyCartDto(identity.SessionId));

        if (cart.Items.Count > 0)
        {
            _context.CartItems.RemoveRange(cart.Items);
            TouchCart(cart, DateTime.UtcNow);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return await BuildCartResponseAsync(userId, sessionId, revalidateStock: false, createIfMissing: false, cancellationToken);
    }

    public async Task<ServiceResult<CartDto>> MergeGuestCartAsync(
        string userId,
        string guestSessionId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(guestSessionId))
            return ServiceResult<CartDto>.Fail("session_required", "Guest SessionId is required.");

        var userCart = await GetOrCreateCartAsync(userId, sessionId: null, cancellationToken);
        var guestCart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.SessionId == guestSessionId.Trim() && c.UserId == null, cancellationToken);

        if (guestCart == null)
            return await BuildCartResponseAsync(userId, sessionId: null, revalidateStock: true, createIfMissing: false, cancellationToken);

        var now = DateTime.UtcNow;
        foreach (var guestItem in guestCart.Items)
        {
            var variant = await _context.ProductVariants
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == guestItem.ProductVariantId, cancellationToken);

            var unitPrice = variant?.Price ?? guestItem.UnitPrice;
            var existing = userCart.Items.FirstOrDefault(i => i.ProductVariantId == guestItem.ProductVariantId);
            if (existing != null)
            {
                existing.Quantity += guestItem.Quantity;
                existing.UnitPrice = unitPrice;
                existing.UpdatedAt = now;
            }
            else
            {
                userCart.Items.Add(new CartItem
                {
                    ProductVariantId = guestItem.ProductVariantId,
                    Quantity = guestItem.Quantity,
                    UnitPrice = unitPrice,
                    CreatedAt = now
                });
            }
        }

        _context.Carts.Remove(guestCart);
        TouchCart(userCart, now);
        await _context.SaveChangesAsync(cancellationToken);

        var adjusted = await RevalidateAndPersistCartAsync(userCart, cancellationToken);
        var dto = await MapCartAsync(userCart, adjusted, cancellationToken);
        return ServiceResult<CartDto>.Ok(dto);
    }

    private async Task<ServiceResult<CartDto>> BuildCartResponseAsync(
        string? userId,
        string? sessionId,
        bool revalidateStock,
        bool createIfMissing,
        CancellationToken cancellationToken)
    {
        var identity = ResolveIdentity(userId, sessionId);
        if (identity == null)
            return ServiceResult<CartDto>.Fail("cart_identity_required", "Authentication or SessionId is required.", StatusCodes.Status401Unauthorized);

        Cart? cart = null;
        if (createIfMissing)
            cart = await GetOrCreateCartAsync(identity.UserId, identity.SessionId, cancellationToken);
        else
            cart = await LoadCartAsync(identity.UserId, identity.SessionId, cancellationToken);

        if (cart == null)
            return ServiceResult<CartDto>.Ok(CreateEmptyCartDto(identity.SessionId));

        if (revalidateStock)
        {
            var adjusted = await RevalidateAndPersistCartAsync(cart, cancellationToken);
            var dto = await MapCartAsync(cart, adjusted, cancellationToken);
            return ServiceResult<CartDto>.Ok(dto);
        }

        var cartDto = await MapCartAsync(cart, adjustedVariantIds: null, cancellationToken);
        return ServiceResult<CartDto>.Ok(cartDto);
    }

    private async Task<HashSet<int>> RevalidateAndPersistCartAsync(Cart cart, CancellationToken cancellationToken)
    {
        var adjustedVariantIds = new HashSet<int>();

        if (cart.Items.Count == 0)
            return adjustedVariantIds;

        var variantIds = cart.Items.Select(i => i.ProductVariantId).ToList();
        var variants = await _context.ProductVariants
            .Include(v => v.Inventory)
            .Include(v => v.Product)
            .Where(v => variantIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        var now = DateTime.UtcNow;
        var itemsToRemove = new List<CartItem>();

        foreach (var item in cart.Items.ToList())
        {
            if (!variants.TryGetValue(item.ProductVariantId, out var variant) ||
                !IsVariantSellable(variant))
            {
                itemsToRemove.Add(item);
                continue;
            }

            item.UnitPrice = variant.Price;
            var available = GetAvailableStock(variant);
            if (item.Quantity > available)
            {
                item.Quantity = available;
                item.UpdatedAt = now;
                adjustedVariantIds.Add(item.ProductVariantId);
            }

            if (item.Quantity <= 0)
                itemsToRemove.Add(item);
        }

        foreach (var item in itemsToRemove)
            _context.CartItems.Remove(item);

        if (itemsToRemove.Count > 0 || cart.Items.Any(i => i.UpdatedAt == now))
            TouchCart(cart, now);

        await _context.SaveChangesAsync(cancellationToken);
        return adjustedVariantIds;
    }

    private async Task<CartDto> MapCartAsync(
        Cart cart,
        HashSet<int>? adjustedVariantIds,
        CancellationToken cancellationToken)
    {
        if (cart.Items.Count == 0)
            return CreateEmptyCartDto(cart.SessionId, cart);

        var variantIds = cart.Items.Select(i => i.ProductVariantId).Distinct().ToList();
        var variants = await _context.ProductVariants
            .AsNoTracking()
            .Include(v => v.Inventory)
            .Include(v => v.Product).ThenInclude(p => p.Translations)
            .Include(v => v.Product).ThenInclude(p => p.Images)
            .Include(v => v.Images)
            .Where(v => variantIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        var items = new List<CartItemDto>();
        foreach (var item in cart.Items.OrderBy(i => i.Id))
        {
            if (!variants.TryGetValue(item.ProductVariantId, out var variant))
                continue;

            var available = GetAvailableStock(variant);
            var maxAllowed = available;
            var stockChanged = adjustedVariantIds?.Contains(variant.Id) == true;

            items.Add(new CartItemDto
            {
                ProductId = variant.ProductId,
                VariantId = variant.Id,
                ProductNameAr = variant.Product.Translations.FirstOrDefault(t => t.LanguageCode == "ar")?.Name ?? string.Empty,
                ProductNameEn = variant.Product.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Name ?? string.Empty,
                ProductSlugAr = variant.Product.Translations.FirstOrDefault(t => t.LanguageCode == "ar")?.Slug ?? string.Empty,
                ProductSlugEn = variant.Product.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Slug ?? string.Empty,
                ColorNameAr = variant.ColorNameAr,
                ColorNameEn = variant.ColorNameEn,
                ImageUrl = ResolveImageUrl(variant),
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                LineTotal = item.UnitPrice * item.Quantity,
                AvailableStock = available,
                StockChanged = stockChanged,
                MaxAllowedQuantity = maxAllowed
            });
        }

        return new CartDto
        {
            CartId = cart.Id,
            SessionId = cart.SessionId,
            LastActivityAt = cart.UpdatedAt ?? cart.CreatedAt,
            ItemsCount = items.Sum(i => i.Quantity),
            SubTotal = items.Sum(i => i.LineTotal),
            Items = items
        };
    }

    private static CartDto CreateEmptyCartDto(string? sessionId, Cart? cart = null) =>
        new()
        {
            CartId = cart?.Id,
            SessionId = sessionId ?? cart?.SessionId,
            LastActivityAt = cart?.UpdatedAt ?? cart?.CreatedAt,
            ItemsCount = 0,
            SubTotal = 0,
            Items = new List<CartItemDto>()
        };

    private async Task<Cart?> LoadCartAsync(string? userId, string? sessionId, CancellationToken cancellationToken)
    {
        var query = _context.Carts
            .Include(c => c.Items)
            .AsQueryable();

        if (!string.IsNullOrEmpty(userId))
            return await query.FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        if (!string.IsNullOrEmpty(sessionId))
            return await query.FirstOrDefaultAsync(c => c.SessionId == sessionId && c.UserId == null, cancellationToken);

        return null;
    }

    private async Task<Cart> GetOrCreateCartAsync(string? userId, string? sessionId, CancellationToken cancellationToken)
    {
        var cart = await LoadCartAsync(userId, sessionId, cancellationToken);
        if (cart != null)
            return cart;

        var now = DateTime.UtcNow;
        cart = new Cart
        {
            UserId = userId,
            SessionId = string.IsNullOrEmpty(userId) ? sessionId : null,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Carts.Add(cart);
        await _context.SaveChangesAsync(cancellationToken);
        return cart;
    }

    private async Task<(ProductVariant? Variant, ServiceError? Error)> LoadActiveVariantAsync(
        int variantId,
        CancellationToken cancellationToken)
    {
        var variant = await _context.ProductVariants
            .Include(v => v.Inventory)
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == variantId, cancellationToken);

        if (variant == null)
            return (null, new ServiceError("variant_not_found", "Product variant not found.", StatusCodes.Status404NotFound));

        if (!IsVariantSellable(variant))
            return (null, new ServiceError("product_unavailable", "Product is not available for purchase.", StatusCodes.Status400BadRequest));

        return (variant, null);
    }

    private static bool IsVariantSellable(ProductVariant variant) =>
        variant.Status == VariantStatus.Active &&
        !variant.Product.IsDeleted &&
        variant.Product.Status == ProductStatus.Active;

    private static int GetAvailableStock(ProductVariant variant) =>
        variant.Inventory == null
            ? 0
            : Math.Max(0, variant.Inventory.QuantityOnHand - variant.Inventory.QuantityReserved);

    private static string? ResolveImageUrl(ProductVariant variant)
    {
        var variantImage = variant.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .FirstOrDefault();

        if (variantImage != null)
            return variantImage.ThumbnailUrl ?? variantImage.ImageUrl;

        var productImage = variant.Product.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .FirstOrDefault();

        return productImage?.ThumbnailUrl ?? productImage?.ImageUrl;
    }

    private static void TouchCart(Cart cart, DateTime timestamp) =>
        cart.UpdatedAt = timestamp;

    private static CartIdentity? ResolveIdentity(string? userId, string? sessionId)
    {
        if (!string.IsNullOrWhiteSpace(userId))
            return new CartIdentity(userId, null);

        if (!string.IsNullOrWhiteSpace(sessionId))
            return new CartIdentity(null, sessionId.Trim());

        return null;
    }

    private sealed record CartIdentity(string? UserId, string? SessionId);

    private sealed record ServiceError(string ErrorCode, string Message, int StatusCode);
}
