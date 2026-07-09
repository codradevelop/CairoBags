using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CairoBags.Migrations
{
    /// <inheritdoc />
    public partial class AddGovernorateShippingFees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "Governorates",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsSelectable",
                table: "Governorates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingFee",
                table: "Governorates",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 1, true, 80m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 2, true, 80m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 6, true, 85m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 7, true, 90m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 0, false, 125m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 14, true, 90m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 17, true, 95m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 8, true, 90m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 11, true, 90m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 16, true, 90m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 19, true, 95m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 0, false, 80m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 0, false, 135m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 12, true, 90m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 24, true, 105m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 20, true, 95m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 18, true, 95m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 10, true, 90m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 15, true, 90m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 9, true, 90m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 32, true, 155m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 22,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 13, true, 90m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 23,
                columns: new[] { "DisplayOrder", "IsSelectable", "NameAr", "NameEn", "ShippingFee" },
                values: new object[] { 27, true, "مرسى مطروح", "Marsa Matruh", 125m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 24,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 23, true, 105m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 25,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 22, true, 105m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 26,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 31, true, 155m });

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 27,
                columns: new[] { "DisplayOrder", "IsSelectable", "ShippingFee" },
                values: new object[] { 21, true, 95m });

            migrationBuilder.InsertData(
                table: "Governorates",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DisplayOrder", "IsSelectable", "NameAr", "NameEn", "ShippingFee", "ShippingZoneId", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { 28, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 3, true, "الخانكة", "Khanka", 80m, 1, null, null },
                    { 29, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 4, true, "أبو زعبل", "Abu Zaabal", 80m, 1, null, null },
                    { 30, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 5, true, "الجبل الأصفر", "El Gebel El Asfar", 80m, 1, null, null },
                    { 31, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 25, true, "الغردقة", "Hurghada", 125m, 3, null, null },
                    { 32, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 26, true, "رأس غارب", "Ras Ghareb", 125m, 3, null, null },
                    { 33, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 28, true, "الساحل الشمالي", "North Coast", 125m, 3, null, null },
                    { 34, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 29, true, "القصير", "El Quseir", 135m, 3, null, null },
                    { 35, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 30, true, "مرسى علم", "Marsa Alam", 135m, 3, null, null }
                });

            migrationBuilder.UpdateData(
                table: "ShippingZones",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "BaseShippingFee", "FreeShippingThreshold" },
                values: new object[] { 80m, null });

            migrationBuilder.UpdateData(
                table: "ShippingZones",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "BaseShippingFee", "FreeShippingThreshold" },
                values: new object[] { 80m, null });

            migrationBuilder.UpdateData(
                table: "ShippingZones",
                keyColumn: "Id",
                keyValue: 3,
                column: "FreeShippingThreshold",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 35);

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "Governorates");

            migrationBuilder.DropColumn(
                name: "IsSelectable",
                table: "Governorates");

            migrationBuilder.DropColumn(
                name: "ShippingFee",
                table: "Governorates");

            migrationBuilder.UpdateData(
                table: "Governorates",
                keyColumn: "Id",
                keyValue: 23,
                columns: new[] { "NameAr", "NameEn" },
                values: new object[] { "مطروح", "Matrouh" });

            migrationBuilder.UpdateData(
                table: "ShippingZones",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "BaseShippingFee", "FreeShippingThreshold" },
                values: new object[] { 50m, 1500m });

            migrationBuilder.UpdateData(
                table: "ShippingZones",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "BaseShippingFee", "FreeShippingThreshold" },
                values: new object[] { 60m, 1500m });

            migrationBuilder.UpdateData(
                table: "ShippingZones",
                keyColumn: "Id",
                keyValue: 3,
                column: "FreeShippingThreshold",
                value: 2000m);
        }
    }
}
