using CairoBags.Models.Shipping;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Data;

internal static class ShippingSeedData
{
    private static readonly DateTime SeedCreatedAt = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public const int GovernorateCount = 35;

    public static void Apply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ShippingZone>().HasData(
            new ShippingZone
            {
                Id = 1,
                Code = ShippingZoneCode.Cairo,
                BaseShippingFee = 80m,
                FreeShippingThreshold = null,
                CreatedAt = SeedCreatedAt
            },
            new ShippingZone
            {
                Id = 2,
                Code = ShippingZoneCode.Giza,
                BaseShippingFee = 80m,
                FreeShippingThreshold = null,
                CreatedAt = SeedCreatedAt
            },
            new ShippingZone
            {
                Id = 3,
                Code = ShippingZoneCode.OtherGovernorates,
                BaseShippingFee = 90m,
                FreeShippingThreshold = null,
                CreatedAt = SeedCreatedAt
            }
        );

        modelBuilder.Entity<ShippingZoneTranslation>().HasData(
            new ShippingZoneTranslation { Id = 1, ShippingZoneId = 1, LanguageCode = "en", Name = "Cairo", CreatedAt = SeedCreatedAt },
            new ShippingZoneTranslation { Id = 2, ShippingZoneId = 1, LanguageCode = "ar", Name = "القاهرة", CreatedAt = SeedCreatedAt },
            new ShippingZoneTranslation { Id = 3, ShippingZoneId = 2, LanguageCode = "en", Name = "Giza", CreatedAt = SeedCreatedAt },
            new ShippingZoneTranslation { Id = 4, ShippingZoneId = 2, LanguageCode = "ar", Name = "الجيزة", CreatedAt = SeedCreatedAt },
            new ShippingZoneTranslation { Id = 5, ShippingZoneId = 3, LanguageCode = "en", Name = "Other Governorates", CreatedAt = SeedCreatedAt },
            new ShippingZoneTranslation { Id = 6, ShippingZoneId = 3, LanguageCode = "ar", Name = "باقي المحافظات", CreatedAt = SeedCreatedAt }
        );

        modelBuilder.Entity<Governorate>().HasData(
            Gov(1, 1, "القاهرة", "Cairo", 80m, 1),
            Gov(2, 2, "الجيزة", "Giza", 80m, 2),
            Gov(3, 3, "الإسكندرية", "Alexandria", 85m, 6),
            Gov(4, 3, "الدقهلية", "Dakahlia", 90m, 7),
            Gov(5, 3, "البحر الأحمر", "Red Sea", 125m, 0, selectable: false),
            Gov(6, 3, "البحيرة", "Beheira", 90m, 14),
            Gov(7, 3, "الفيوم", "Fayoum", 95m, 17),
            Gov(8, 3, "الغربية", "Gharbia", 90m, 8),
            Gov(9, 3, "الإسماعيلية", "Ismailia", 90m, 11),
            Gov(10, 3, "المنوفية", "Monufia", 90m, 16),
            Gov(11, 3, "المنيا", "Minya", 95m, 19),
            Gov(12, 3, "القليوبية", "Qalyubia", 80m, 0, selectable: false),
            Gov(13, 3, "الوادي الجديد", "New Valley", 135m, 0, selectable: false),
            Gov(14, 3, "السويس", "Suez", 90m, 12),
            Gov(15, 3, "أسوان", "Aswan", 105m, 24),
            Gov(16, 3, "أسيوط", "Assiut", 95m, 20),
            Gov(17, 3, "بني سويف", "Beni Suef", 95m, 18),
            Gov(18, 3, "بورسعيد", "Port Said", 90m, 10),
            Gov(19, 3, "دمياط", "Damietta", 90m, 15),
            Gov(20, 3, "الشرقية", "Sharqia", 90m, 9),
            Gov(21, 3, "جنوب سيناء", "South Sinai", 155m, 32),
            Gov(22, 3, "كفر الشيخ", "Kafr El Sheikh", 90m, 13),
            Gov(23, 3, "مرسى مطروح", "Marsa Matruh", 125m, 27),
            Gov(24, 3, "الأقصر", "Luxor", 105m, 23),
            Gov(25, 3, "قنا", "Qena", 105m, 22),
            Gov(26, 3, "شمال سيناء", "North Sinai", 155m, 31),
            Gov(27, 3, "سوهاج", "Sohag", 95m, 21),
            Gov(28, 1, "الخانكة", "Khanka", 80m, 3),
            Gov(29, 1, "أبو زعبل", "Abu Zaabal", 80m, 4),
            Gov(30, 1, "الجبل الأصفر", "El Gebel El Asfar", 80m, 5),
            Gov(31, 3, "الغردقة", "Hurghada", 125m, 25),
            Gov(32, 3, "رأس غارب", "Ras Ghareb", 125m, 26),
            Gov(33, 3, "الساحل الشمالي", "North Coast", 125m, 28),
            Gov(34, 3, "القصير", "El Quseir", 135m, 29),
            Gov(35, 3, "مرسى علم", "Marsa Alam", 135m, 30)
        );
    }

    private static Governorate Gov(
        int id,
        int zoneId,
        string nameAr,
        string nameEn,
        decimal shippingFee,
        int displayOrder,
        bool selectable = true) =>
        new()
        {
            Id = id,
            ShippingZoneId = zoneId,
            NameAr = nameAr,
            NameEn = nameEn,
            ShippingFee = shippingFee,
            DisplayOrder = displayOrder,
            IsSelectable = selectable,
            CreatedAt = SeedCreatedAt
        };
}
