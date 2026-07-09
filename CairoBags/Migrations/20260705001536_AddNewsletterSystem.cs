using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CairoBags.Migrations
{
    /// <inheritdoc />
    public partial class AddNewsletterSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NewsletterSubscribers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    IsSubscribed = table.Column<bool>(type: "bit", nullable: false),
                    SubscribedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UnsubscribedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastEmailSentAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Language = table.Column<string>(type: "nchar(2)", fixedLength: true, maxLength: 2, nullable: false),
                    UnsubscribeToken = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NewsletterSubscribers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductLaunchNotifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RecipientCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductLaunchNotifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NewsletterEmailJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SubscriberId = table.Column<int>(type: "int", nullable: true),
                    ToEmail = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    EmailType = table.Column<byte>(type: "tinyint", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: true),
                    Subject = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    HtmlBody = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    Retries = table.Column<int>(type: "int", nullable: false),
                    Error = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NewsletterEmailJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NewsletterEmailJobs_NewsletterSubscribers_SubscriberId",
                        column: x => x.SubscriberId,
                        principalTable: "NewsletterSubscribers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NewsletterEmailJobs_CreatedAt",
                table: "NewsletterEmailJobs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_NewsletterEmailJobs_EmailType",
                table: "NewsletterEmailJobs",
                column: "EmailType");

            migrationBuilder.CreateIndex(
                name: "IX_NewsletterEmailJobs_ProductId_EmailType",
                table: "NewsletterEmailJobs",
                columns: new[] { "ProductId", "EmailType" });

            migrationBuilder.CreateIndex(
                name: "IX_NewsletterEmailJobs_Status",
                table: "NewsletterEmailJobs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_NewsletterEmailJobs_SubscriberId",
                table: "NewsletterEmailJobs",
                column: "SubscriberId");

            migrationBuilder.CreateIndex(
                name: "IX_NewsletterSubscribers_Email",
                table: "NewsletterSubscribers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NewsletterSubscribers_IsSubscribed",
                table: "NewsletterSubscribers",
                column: "IsSubscribed");

            migrationBuilder.CreateIndex(
                name: "IX_NewsletterSubscribers_SubscribedAt",
                table: "NewsletterSubscribers",
                column: "SubscribedAt");

            migrationBuilder.CreateIndex(
                name: "IX_NewsletterSubscribers_UnsubscribeToken",
                table: "NewsletterSubscribers",
                column: "UnsubscribeToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductLaunchNotifications_ProductId",
                table: "ProductLaunchNotifications",
                column: "ProductId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductLaunchNotifications_SentAt",
                table: "ProductLaunchNotifications",
                column: "SentAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NewsletterEmailJobs");

            migrationBuilder.DropTable(
                name: "ProductLaunchNotifications");

            migrationBuilder.DropTable(
                name: "NewsletterSubscribers");
        }
    }
}
