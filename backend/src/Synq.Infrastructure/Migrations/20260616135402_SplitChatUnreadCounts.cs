using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Synq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SplitChatUnreadCounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnreadCount",
                table: "Chats");

            migrationBuilder.AddColumn<int>(
                name: "UnreadCountByParticipant",
                table: "Chats",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UnreadCountByUser",
                table: "Chats",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnreadCountByParticipant",
                table: "Chats");

            migrationBuilder.DropColumn(
                name: "UnreadCountByUser",
                table: "Chats");

            migrationBuilder.AddColumn<int>(
                name: "UnreadCount",
                table: "Chats",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
