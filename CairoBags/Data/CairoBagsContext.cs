using CairoBags.Models;
using CairoBags.Models.Analytics;
using CairoBags.Models.Catalog;
using CairoBags.Models.Commerce;
using CairoBags.Models.Coupons;
using CairoBags.Models.Marketing;
using CairoBags.Models.Identity;
using CairoBags.Models.Inventories;
using CairoBags.Models.Orders;
using CairoBags.Models.Payments;
using CairoBags.Models.Reviews;
using CairoBags.Models.Shipping;
using CairoBags.Models.System;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Data;

public class CairoBagsContext : IdentityDbContext<ApplicationUser>
{
    public CairoBagsContext(DbContextOptions<CairoBagsContext> options)
        : base(options)
    {
    }

    public virtual DbSet<CustomerProfile> CustomerProfiles { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<CategoryTranslation> CategoryTranslations { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductTranslation> ProductTranslations { get; set; }

    public virtual DbSet<ProductVariant> ProductVariants { get; set; }

    public virtual DbSet<ProductImage> ProductImages { get; set; }

    public virtual DbSet<Inventory> Inventories { get; set; }

    public virtual DbSet<InventoryMovement> InventoryMovements { get; set; }

    public virtual DbSet<Cart> Carts { get; set; }

    public virtual DbSet<CartItem> CartItems { get; set; }

    public virtual DbSet<Wishlist> Wishlists { get; set; }

    public virtual DbSet<WishlistItem> WishlistItems { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }

    public virtual DbSet<ShippingAddress> ShippingAddresses { get; set; }

    public virtual DbSet<ShippingZone> ShippingZones { get; set; }

    public virtual DbSet<ShippingZoneTranslation> ShippingZoneTranslations { get; set; }

    public virtual DbSet<Governorate> Governorates { get; set; }

    public virtual DbSet<PaymentMethod> PaymentMethods { get; set; }

    public virtual DbSet<PaymentMethodTranslation> PaymentMethodTranslations { get; set; }

    public virtual DbSet<OrderPayment> OrderPayments { get; set; }

    public virtual DbSet<PaymentProofImage> PaymentProofImages { get; set; }

    public virtual DbSet<ProductReview> ProductReviews { get; set; }

    public virtual DbSet<ReviewImage> ReviewImages { get; set; }

    public virtual DbSet<ReviewHelpful> ReviewHelpfuls { get; set; }

    public virtual DbSet<Coupon> Coupons { get; set; }

    public virtual DbSet<CouponUsage> CouponUsages { get; set; }

    public virtual DbSet<Banner> Banners { get; set; }

    public virtual DbSet<BannerTranslation> BannerTranslations { get; set; }

    public virtual DbSet<NewsletterSubscriber> NewsletterSubscribers { get; set; }

    public virtual DbSet<NewsletterEmailJob> NewsletterEmailJobs { get; set; }

    public virtual DbSet<ProductLaunchNotification> ProductLaunchNotifications { get; set; }

    public virtual DbSet<DailySalesSummary> DailySalesSummaries { get; set; }

    public virtual DbSet<UserProductView> UserProductViews { get; set; }

    public virtual DbSet<TrendingProduct> TrendingProducts { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<SystemSetting> SystemSettings { get; set; }

    public virtual DbSet<PasswordResetOtp> PasswordResetOtps { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        SeedIdentityRoles(modelBuilder);
        ConfigureIdentity(modelBuilder);
        ConfigureCustomerProfile(modelBuilder);
        ConfigureCatalog(modelBuilder);
        ConfigureInventory(modelBuilder);
        ConfigureCommerce(modelBuilder);
        ConfigureOrders(modelBuilder);
        ConfigureShipping(modelBuilder);
        ConfigurePayments(modelBuilder);
        ConfigureReviews(modelBuilder);
        ConfigureCoupons(modelBuilder);
        ConfigureMarketing(modelBuilder);
        ConfigureAnalytics(modelBuilder);
        ConfigureSystem(modelBuilder);
        ConfigureLegacyEntities(modelBuilder);
    }

    private static void SeedIdentityRoles(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<IdentityRole>().HasData(
            new IdentityRole { Id = "1", Name = "Admin", NormalizedName = "ADMIN", ConcurrencyStamp = "1" },
            new IdentityRole { Id = "2", Name = "Customer", NormalizedName = "CUSTOMER", ConcurrencyStamp = "2" }
        );
    }

    private static void ConfigureIdentity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("Users");
            entity.Property(e => e.AuthProvider).HasMaxLength(32).HasDefaultValue("Local");
            entity.Property(e => e.PreferredLanguage).HasMaxLength(2).HasDefaultValue("en");
            entity.Property(e => e.NotificationSettingsJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.RefreshToken).HasMaxLength(512);
        });
    }

    private static void ConfigureCustomerProfile(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CustomerProfile>(entity =>
        {
            entity.ToTable("CustomerProfiles");
            entity.HasIndex(e => e.UserId).IsUnique();

            entity.HasOne(e => e.User)
                .WithOne(e => e.CustomerProfile)
                .HasForeignKey<CustomerProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCatalog(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");
            entity.Property(e => e.ImageUrl).HasMaxLength(500);

            entity.HasOne(e => e.ParentCategory)
                .WithMany(e => e.SubCategories)
                .HasForeignKey(e => e.ParentCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CategoryTranslation>(entity =>
        {
            entity.ToTable("CategoryTranslations");
            entity.Property(e => e.LanguageCode).HasMaxLength(2).IsFixedLength();
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Slug).HasMaxLength(250);
            entity.Property(e => e.MetaTitle).HasMaxLength(200);
            entity.Property(e => e.MetaDescription).HasMaxLength(500);

            entity.HasIndex(e => new { e.CategoryId, e.LanguageCode }).IsUnique();
            entity.HasIndex(e => new { e.Slug, e.LanguageCode }).IsUnique();

            entity.HasOne(e => e.Category)
                .WithMany(e => e.Translations)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products");
            entity.Property(e => e.Status).HasConversion<byte>();
            entity.Property(e => e.CompareAtPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.AverageRating).HasColumnType("decimal(3,2)");

            entity.HasOne(e => e.Category)
                .WithMany(e => e.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductTranslation>(entity =>
        {
            entity.ToTable("ProductTranslations");
            entity.Property(e => e.LanguageCode).HasMaxLength(2).IsFixedLength();
            entity.Property(e => e.Name).HasMaxLength(300);
            entity.Property(e => e.ShortDescription).HasMaxLength(500);
            entity.Property(e => e.Slug).HasMaxLength(250);
            entity.Property(e => e.MetaTitle).HasMaxLength(200);
            entity.Property(e => e.MetaDescription).HasMaxLength(500);

            entity.HasIndex(e => new { e.ProductId, e.LanguageCode }).IsUnique();
            entity.HasIndex(e => new { e.Slug, e.LanguageCode }).IsUnique();

            entity.HasOne(e => e.Product)
                .WithMany(e => e.Translations)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.ToTable("ProductVariants");
            entity.Property(e => e.ColorNameAr).HasMaxLength(100);
            entity.Property(e => e.ColorNameEn).HasMaxLength(100);
            entity.Property(e => e.SizeNameAr).HasMaxLength(100);
            entity.Property(e => e.SizeNameEn).HasMaxLength(100);
            entity.Property(e => e.Sku).HasMaxLength(64);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CompareAtPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).HasConversion<byte>();

            entity.HasIndex(e => e.Sku).IsUnique();

            entity.HasOne(e => e.Product)
                .WithMany(e => e.Variants)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.ToTable("ProductImages");
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.ThumbnailUrl).HasMaxLength(500);
            entity.Property(e => e.AltTextAr).HasMaxLength(200);
            entity.Property(e => e.AltTextEn).HasMaxLength(200);

            entity.HasIndex(e => new { e.ProductId, e.SortOrder });

            entity.HasOne(e => e.Product)
                .WithMany(e => e.Images)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Variant)
                .WithMany(e => e.Images)
                .HasForeignKey(e => e.VariantId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });
    }

    private static void ConfigureInventory(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Inventory>(entity =>
        {
            entity.ToTable("Inventories");

            entity.Property(e => e.RowVersion).IsRowVersion();

            entity.HasIndex(e => e.ProductVariantId).IsUnique();

            entity.HasOne(e => e.ProductVariant)
                .WithOne(e => e.Inventory)
                .HasForeignKey<Inventory>(e => e.ProductVariantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InventoryMovement>(entity =>
        {
            entity.ToTable("InventoryMovements");

            entity.Property(e => e.Type).HasConversion<byte>();
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.ReferenceNumber).HasMaxLength(64);

            entity.HasIndex(e => e.InventoryId);
            entity.HasIndex(e => new { e.InventoryId, e.CreatedAt });
            entity.HasIndex(e => e.ReferenceNumber);

            entity.HasOne(e => e.Inventory)
                .WithMany(e => e.Movements)
                .HasForeignKey(e => e.InventoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCommerce(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.ToTable("Carts");

            entity.Property(e => e.UserId).HasMaxLength(450);
            entity.Property(e => e.SessionId).HasMaxLength(128);

            entity.HasIndex(e => e.UserId)
                .IsUnique()
                .HasFilter("[UserId] IS NOT NULL");

            entity.HasIndex(e => e.SessionId)
                .IsUnique()
                .HasFilter("[SessionId] IS NOT NULL");

            entity.HasOne(e => e.User)
                .WithOne(e => e.Cart)
                .HasForeignKey<Cart>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.ToTable("CartItems");

            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");

            entity.HasIndex(e => new { e.CartId, e.ProductVariantId }).IsUnique();
            entity.HasIndex(e => e.CartId);

            entity.HasOne(e => e.Cart)
                .WithMany(e => e.Items)
                .HasForeignKey(e => e.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ProductVariant)
                .WithMany(e => e.CartItems)
                .HasForeignKey(e => e.ProductVariantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Wishlist>(entity =>
        {
            entity.ToTable("Wishlists");

            entity.Property(e => e.UserId).HasMaxLength(450);

            entity.HasIndex(e => e.UserId).IsUnique();

            entity.HasOne(e => e.User)
                .WithOne(e => e.Wishlist)
                .HasForeignKey<Wishlist>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WishlistItem>(entity =>
        {
            entity.ToTable("WishlistItems");

            entity.HasIndex(e => new { e.WishlistId, e.ProductId }).IsUnique();
            entity.HasIndex(e => e.WishlistId);

            entity.HasOne(e => e.Wishlist)
                .WithMany(e => e.Items)
                .HasForeignKey(e => e.WishlistId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Product)
                .WithMany(e => e.WishlistItems)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureOrders(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");

            entity.Property(e => e.UserId).HasMaxLength(450);
            entity.Property(e => e.OrderNumber).HasMaxLength(32);
            entity.Property(e => e.Status).HasConversion<byte>();
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ShippingFee).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CouponCode).HasMaxLength(32);
            entity.Property(e => e.CouponDiscount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CurrencyCode).HasMaxLength(3).HasDefaultValue("EGP");
            entity.Property(e => e.ShippingFullName).HasMaxLength(200);
            entity.Property(e => e.ShippingPhoneNumber).HasMaxLength(32);
            entity.Property(e => e.ShippingGovernorate).HasMaxLength(100);
            entity.Property(e => e.ShippingCity).HasMaxLength(100);
            entity.Property(e => e.ShippingAddressLine1).HasMaxLength(300);
            entity.Property(e => e.ShippingAddressLine2).HasMaxLength(300);
            entity.Property(e => e.ShippingPostalCode).HasMaxLength(20);
            entity.Property(e => e.Notes).HasMaxLength(1000);

            entity.HasIndex(e => e.OrderNumber).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => new { e.UserId, e.CreatedAt });

            entity.HasOne(e => e.User)
                .WithMany(e => e.Orders)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems");

            entity.Property(e => e.ProductNameAr).HasMaxLength(300);
            entity.Property(e => e.ProductNameEn).HasMaxLength(300);
            entity.Property(e => e.ColorNameAr).HasMaxLength(100);
            entity.Property(e => e.ColorNameEn).HasMaxLength(100);
            entity.Property(e => e.Sku).HasMaxLength(64);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ImageUrl).HasMaxLength(500);

            entity.HasIndex(e => e.OrderId);
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.ProductVariantId);

            entity.HasOne(e => e.Order)
                .WithMany(e => e.Items)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Product)
                .WithMany(e => e.OrderItems)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ProductVariant)
                .WithMany(e => e.OrderItems)
                .HasForeignKey(e => e.ProductVariantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderStatusHistory>(entity =>
        {
            entity.ToTable("OrderStatusHistories");

            entity.Property(e => e.OldStatus).HasConversion<byte?>();
            entity.Property(e => e.NewStatus).HasConversion<byte>();
            entity.Property(e => e.Notes).HasMaxLength(1000);

            entity.HasIndex(e => e.OrderId);
            entity.HasIndex(e => new { e.OrderId, e.CreatedAt });

            entity.HasOne(e => e.Order)
                .WithMany(e => e.StatusHistory)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ShippingAddress>(entity =>
        {
            entity.ToTable("ShippingAddresses");

            entity.Property(e => e.UserId).HasMaxLength(450);
            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.PhoneNumber).HasMaxLength(32);
            entity.Property(e => e.Governorate).HasMaxLength(100);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.AddressLine1).HasMaxLength(300);
            entity.Property(e => e.AddressLine2).HasMaxLength(300);
            entity.Property(e => e.PostalCode).HasMaxLength(20);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.UserId)
                .IsUnique()
                .HasFilter("[IsDefault] = 1");

            entity.HasOne(e => e.User)
                .WithMany(e => e.ShippingAddresses)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureShipping(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ShippingZone>(entity =>
        {
            entity.ToTable("ShippingZones");

            entity.Property(e => e.Code).HasConversion<byte>();
            entity.Property(e => e.BaseShippingFee).HasColumnType("decimal(18,2)");
            entity.Property(e => e.FreeShippingThreshold).HasColumnType("decimal(18,2)");

            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<ShippingZoneTranslation>(entity =>
        {
            entity.ToTable("ShippingZoneTranslations");

            entity.Property(e => e.LanguageCode).HasMaxLength(2).IsFixedLength();
            entity.Property(e => e.Name).HasMaxLength(200);

            entity.HasIndex(e => new { e.ShippingZoneId, e.LanguageCode }).IsUnique();

            entity.HasOne(e => e.ShippingZone)
                .WithMany(e => e.Translations)
                .HasForeignKey(e => e.ShippingZoneId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Governorate>(entity =>
        {
            entity.ToTable("Governorates");

            entity.Property(e => e.NameAr).HasMaxLength(100);
            entity.Property(e => e.NameEn).HasMaxLength(100);

            entity.HasIndex(e => e.ShippingZoneId);
            entity.HasIndex(e => e.NameAr).IsUnique();
            entity.HasIndex(e => e.NameEn).IsUnique();

            entity.HasOne(e => e.ShippingZone)
                .WithMany(e => e.Governorates)
                .HasForeignKey(e => e.ShippingZoneId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        ShippingSeedData.Apply(modelBuilder);
    }

    private static void ConfigurePayments(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PaymentMethod>(entity =>
        {
            entity.ToTable("PaymentMethods");

            entity.Property(e => e.Type).HasConversion<byte>();

            entity.HasIndex(e => e.Type).IsUnique();
        });

        modelBuilder.Entity<PaymentMethodTranslation>(entity =>
        {
            entity.ToTable("PaymentMethodTranslations");

            entity.Property(e => e.LanguageCode).HasMaxLength(2).IsFixedLength();
            entity.Property(e => e.DisplayName).HasMaxLength(200);
            entity.Property(e => e.Instructions).HasColumnType("nvarchar(max)");

            entity.HasIndex(e => new { e.PaymentMethodId, e.LanguageCode }).IsUnique();

            entity.HasOne(e => e.PaymentMethod)
                .WithMany(e => e.Translations)
                .HasForeignKey(e => e.PaymentMethodId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderPayment>(entity =>
        {
            entity.ToTable("OrderPayments");

            entity.Property(e => e.Status).HasConversion<byte>();
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.SenderName).HasMaxLength(200);
            entity.Property(e => e.SenderPhone).HasMaxLength(32);
            entity.Property(e => e.TransactionReference).HasMaxLength(128);
            entity.Property(e => e.ReviewedBy).HasMaxLength(450);
            entity.Property(e => e.ReviewNotes).HasMaxLength(1000);

            entity.HasIndex(e => e.OrderId).IsUnique();
            entity.HasIndex(e => e.PaymentMethodId);
            entity.HasIndex(e => e.Status);

            entity.HasOne(e => e.Order)
                .WithOne(e => e.Payment)
                .HasForeignKey<OrderPayment>(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.PaymentMethod)
                .WithMany(e => e.OrderPayments)
                .HasForeignKey(e => e.PaymentMethodId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PaymentProofImage>(entity =>
        {
            entity.ToTable("PaymentProofImages");

            entity.Property(e => e.ImageUrl).HasMaxLength(500);

            entity.HasIndex(e => e.OrderPaymentId);
            entity.HasIndex(e => new { e.OrderPaymentId, e.IsPrimary })
                .IsUnique()
                .HasFilter("[IsPrimary] = 1");

            entity.HasOne(e => e.OrderPayment)
                .WithMany(e => e.ProofImages)
                .HasForeignKey(e => e.OrderPaymentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        PaymentSeedData.Apply(modelBuilder);
    }

    private static void ConfigureReviews(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductReview>(entity =>
        {
            entity.ToTable("ProductReviews");

            entity.Property(e => e.UserId).HasMaxLength(450);
            entity.Property(e => e.Status).HasConversion<byte>();
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.Comment).HasMaxLength(2000);
            entity.Property(e => e.AdminResponse).HasMaxLength(2000);

            entity.HasIndex(e => new { e.ProductId, e.UserId }).IsUnique();
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.OrderId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.IsVisible);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.ProductId, e.Status });
            entity.HasIndex(e => new { e.ProductId, e.IsVisible });

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_ProductReviews_Rating",
                "[Rating] >= 1 AND [Rating] <= 5"));

            entity.HasOne(e => e.Product)
                .WithMany(e => e.Reviews)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.User)
                .WithMany(e => e.ProductReviews)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Order)
                .WithMany()
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ReviewImage>(entity =>
        {
            entity.ToTable("ReviewImages");

            entity.Property(e => e.ImageUrl).HasMaxLength(500);

            entity.HasIndex(e => e.ProductReviewId);
            entity.HasIndex(e => new { e.ProductReviewId, e.IsPrimary })
                .IsUnique()
                .HasFilter("[IsPrimary] = 1");

            entity.HasOne(e => e.ProductReview)
                .WithMany(e => e.Images)
                .HasForeignKey(e => e.ProductReviewId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ReviewHelpful>(entity =>
        {
            entity.ToTable("ReviewHelpfuls");

            entity.Property(e => e.UserId).HasMaxLength(450);

            entity.HasIndex(e => e.ProductReviewId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.ProductReviewId, e.UserId }).IsUnique();

            entity.HasOne(e => e.ProductReview)
                .WithMany(e => e.HelpfulVotes)
                .HasForeignKey(e => e.ProductReviewId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureCoupons(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Coupon>(entity =>
        {
            entity.ToTable("Coupons", t =>
            {
                t.HasCheckConstraint(
                    "CK_Coupons_Scope",
                    "NOT ([ProductId] IS NOT NULL AND [CategoryId] IS NOT NULL)");
                t.HasCheckConstraint(
                    "CK_Coupons_UsageCount",
                    "[UsageCount] >= 0");
            });

            entity.Property(e => e.Code).HasMaxLength(32);
            entity.Property(e => e.Type).HasConversion<byte>();
            entity.Property(e => e.Value).HasColumnType("decimal(18,2)");
            entity.Property(e => e.MinimumOrderAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.MaximumDiscountAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.PerCustomerUsageLimit).HasDefaultValue(1);
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => new { e.StartDate, e.EndDate });
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.CategoryId);

            entity.HasOne(e => e.Product)
                .WithMany(e => e.Coupons)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Category)
                .WithMany(e => e.Coupons)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CouponUsage>(entity =>
        {
            entity.ToTable("CouponUsages");

            entity.Property(e => e.UserId).HasMaxLength(450);
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");

            entity.HasIndex(e => e.OrderId).IsUnique();
            entity.HasIndex(e => e.CouponId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.CouponId, e.UserId });

            entity.HasOne(e => e.Coupon)
                .WithMany(e => e.Usages)
                .HasForeignKey(e => e.CouponId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.User)
                .WithMany(e => e.CouponUsages)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Order)
                .WithOne(e => e.CouponUsage)
                .HasForeignKey<CouponUsage>(e => e.OrderId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureMarketing(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Banner>(entity =>
        {
            entity.ToTable("Banners");

            entity.Property(e => e.Position).HasConversion<byte>();
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.MobileImageUrl).HasMaxLength(500);
            entity.Property(e => e.ButtonUrl).HasMaxLength(500);

            entity.HasIndex(e => new { e.Position, e.DisplayOrder });
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => new { e.Position, e.IsActive, e.StartDate, e.EndDate });
        });

        modelBuilder.Entity<BannerTranslation>(entity =>
        {
            entity.ToTable("BannerTranslations");

            entity.Property(e => e.LanguageCode).HasMaxLength(2).IsFixedLength();
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.Subtitle).HasMaxLength(500);
            entity.Property(e => e.ButtonText).HasMaxLength(100);

            entity.HasIndex(e => new { e.BannerId, e.LanguageCode }).IsUnique();

            entity.HasOne(e => e.Banner)
                .WithMany(e => e.Translations)
                .HasForeignKey(e => e.BannerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NewsletterSubscriber>(entity =>
        {
            entity.ToTable("NewsletterSubscribers");

            entity.Property(e => e.Email).HasMaxLength(320).IsRequired();
            entity.Property(e => e.Language).HasMaxLength(2).IsFixedLength();
            entity.Property(e => e.UnsubscribeToken).HasMaxLength(64).IsRequired();

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.UnsubscribeToken).IsUnique();
            entity.HasIndex(e => e.IsSubscribed);
            entity.HasIndex(e => e.SubscribedAt);
        });

        modelBuilder.Entity<NewsletterEmailJob>(entity =>
        {
            entity.ToTable("NewsletterEmailJobs");

            entity.Property(e => e.ToEmail).HasMaxLength(320).IsRequired();
            entity.Property(e => e.Subject).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Error).HasMaxLength(2000);
            entity.Property(e => e.EmailType).HasConversion<byte>();
            entity.Property(e => e.Status).HasConversion<byte>();

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.EmailType);
            entity.HasIndex(e => new { e.ProductId, e.EmailType });
            entity.HasIndex(e => e.CreatedAt);

            entity.HasOne(e => e.Subscriber)
                .WithMany()
                .HasForeignKey(e => e.SubscriberId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProductLaunchNotification>(entity =>
        {
            entity.ToTable("ProductLaunchNotifications");

            entity.HasIndex(e => e.ProductId).IsUnique();
            entity.HasIndex(e => e.SentAt);
        });
    }

    private static void ConfigureAnalytics(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DailySalesSummary>(entity =>
        {
            entity.ToTable("DailySalesSummaries");

            entity.Property(e => e.Revenue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.AverageOrderValue).HasColumnType("decimal(18,2)");

            entity.HasIndex(e => e.SummaryDate).IsUnique();
        });

        modelBuilder.Entity<UserProductView>(entity =>
        {
            entity.ToTable("UserProductViews", t => t.HasCheckConstraint(
                "CK_UserProductViews_Viewer",
                "[UserId] IS NOT NULL OR [SessionId] IS NOT NULL"));

            entity.Property(e => e.UserId).HasMaxLength(450);
            entity.Property(e => e.SessionId).HasMaxLength(128);

            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.ViewedAt);
            entity.HasIndex(e => new { e.ProductId, e.ViewedAt });

            entity.HasOne(e => e.User)
                .WithMany(e => e.ProductViews)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Product)
                .WithMany(e => e.ProductViews)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TrendingProduct>(entity =>
        {
            entity.ToTable("TrendingProducts");

            entity.Property(e => e.Score).HasColumnType("decimal(18,4)");

            entity.HasIndex(e => e.ProductId).IsUnique();
            entity.HasIndex(e => e.Score);

            entity.HasOne(e => e.Product)
                .WithOne(e => e.TrendingProduct)
                .HasForeignKey<TrendingProduct>(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureSystem(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SystemSetting>(entity =>
        {
            entity.ToTable("SystemSettings");

            entity.Property(e => e.StoreNameAr).HasMaxLength(200);
            entity.Property(e => e.StoreNameEn).HasMaxLength(200);
            entity.Property(e => e.StoreEmail).HasMaxLength(256);
            entity.Property(e => e.StorePhone).HasMaxLength(32);
            entity.Property(e => e.StoreAddress).HasMaxLength(500);
            entity.Property(e => e.FacebookUrl).HasMaxLength(500);
            entity.Property(e => e.InstagramUrl).HasMaxLength(500);
            entity.Property(e => e.TikTokUrl).HasMaxLength(500);
            entity.Property(e => e.WhatsAppNumber).HasMaxLength(32);
            entity.Property(e => e.DefaultCurrency).HasMaxLength(3).HasDefaultValue("EGP");
            entity.Property(e => e.FreeShippingThreshold).HasColumnType("decimal(18,2)");

            entity.HasIndex(e => e.Id).IsUnique();

            entity.HasData(
                new SystemSetting
                {
                    Id = 1,
                    StoreNameAr = "كايرو باجز",
                    StoreNameEn = "Cairo Bags",
                    DefaultCurrency = "EGP",
                    MaintenanceMode = false,
                    BetaFeatures = false
                }
            );
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs");

            entity.Property(e => e.UserId).HasMaxLength(450);
            entity.Property(e => e.EntityName).HasMaxLength(128);
            entity.Property(e => e.EntityId).HasMaxLength(64);
            entity.Property(e => e.Action).HasConversion<byte>();
            entity.Property(e => e.OldValues).HasColumnType("nvarchar(max)");
            entity.Property(e => e.NewValues).HasColumnType("nvarchar(max)");
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(512);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.EntityName, e.EntityId });
            entity.HasIndex(e => e.Action);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.UserId, e.CreatedAt });

            entity.HasOne(e => e.User)
                .WithMany(e => e.AuditLogs)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureLegacyEntities(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PasswordResetOtp>(entity =>
        {
            entity.ToTable("PasswordResetOtps");
            entity.HasIndex(e => e.NormalizedEmail);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(256);
            entity.Property(e => e.CodeHash).HasMaxLength(128);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications");
            entity.Property(e => e.Title).HasMaxLength(150);
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.Type).HasConversion<byte>();
            entity.Property(e => e.TargetType).HasMaxLength(50);

            entity.HasIndex(e => new { e.UserId, e.CreatedAtUtc });
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => new { e.UserId, e.IsRead });

            entity.HasOne(e => e.User)
                .WithMany(e => e.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
