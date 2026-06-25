using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CairoBags.Migrations
{
    /// <inheritdoc />
    public partial class AddSizeFieldsToVariant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SizeNameAr",
                table: "ProductVariants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SizeNameEn",
                table: "ProductVariants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SizeNameAr",
                table: "ProductVariants");

            migrationBuilder.DropColumn(
                name: "SizeNameEn",
                table: "ProductVariants");
        }
    }
}
