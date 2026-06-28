using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CairoBags.Migrations
{
    /// <inheritdoc />
    public partial class Cpcutdown : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Coupons",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PerCustomerUsageLimit",
                table: "Coupons",
                type: "int",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "PerCustomerUsageLimit",
                table: "Coupons");
        }
    }
}
