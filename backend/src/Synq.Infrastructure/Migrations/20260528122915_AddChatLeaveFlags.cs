using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Synq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChatLeaveFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsLeftByParticipant",
                table: "Chats",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsLeftByUser",
                table: "Chats",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LeftAtByParticipant",
                table: "Chats",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LeftAtByUser",
                table: "Chats",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsLeftByParticipant",
                table: "Chats");

            migrationBuilder.DropColumn(
                name: "IsLeftByUser",
                table: "Chats");

            migrationBuilder.DropColumn(
                name: "LeftAtByParticipant",
                table: "Chats");

            migrationBuilder.DropColumn(
                name: "LeftAtByUser",
                table: "Chats");
        }
    }
}
