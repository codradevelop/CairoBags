using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CairoBags.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationDeepLinkPath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeepLinkPath",
                table: "Notifications",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeepLinkPath",
                table: "Notifications");
        }
    }
}
