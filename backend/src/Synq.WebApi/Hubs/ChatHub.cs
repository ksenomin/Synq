using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Synq.Domain.Entities;
using Synq.Infrastructure.Data;

namespace Synq.WebApi.Hubs;

/// <summary>
/// SignalR hub for real-time chat communication.
/// Handles message sending, read receipts, and typing indicators.
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly AppDbContext _context;
    private static readonly Dictionary<string, string> _userConnections = new();

    public ChatHub(AppDbContext context) => _context = context;

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId.HasValue)
        {
            _userConnections[userId.Value.ToString()] = Context.ConnectionId;
            await Clients.All.SendAsync("UserOnline", userId.Value);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId.HasValue)
        {
            _userConnections.Remove(userId.Value.ToString());
            await Clients.All.SendAsync("UserOffline", userId.Value);
        }
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Sends a message to a chat and notifies the receiver.
    /// </summary>
    public async Task SendMessage(Guid chatId, string text)
    {
        var senderId = GetUserId() ?? throw new HubException("Unauthorized");

        var chat = await _context.Chats.FindAsync(chatId);
        if (chat == null || (chat.UserId != senderId && chat.ParticipantId != senderId))
            throw new HubException("Access denied");

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ChatId = chatId,
            SenderId = senderId,
            Text = text,
            CreatedAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);

        chat.LastMessage = text;
        chat.LastMessageAt = DateTime.UtcNow;

        var receiverId = chat.UserId == senderId ? chat.ParticipantId : chat.UserId;
        if (chat.UserId != senderId)
            chat.UnreadCount++;

        await _context.SaveChangesAsync();

        var sender = await _context.Users.FindAsync(senderId);
        var messageDto = new
        {
            id = message.Id,
            chatId = message.ChatId,
            senderId = message.SenderId,
            senderName = sender!.Name,
            senderAvatar = sender.AvatarUrl,
            text = message.Text,
            isRead = false,
            attachments = Array.Empty<string>(),
            createdAt = message.CreatedAt
        };

        // Отправляем всем участникам чата
        var receiverConnectionId = _userConnections.GetValueOrDefault(receiverId.ToString());
        if (receiverConnectionId != null)
        {
            await Clients.Client(receiverConnectionId).SendAsync("ReceiveMessage", messageDto);
        }

        // Также отправляем отправителю для подтверждения
        await Clients.Caller.SendAsync("MessageSent", messageDto);

        // Обновляем чат в списке у получателя
        var chatUpdateDto = new
        {
            chatId = chat.Id,
            lastMessage = chat.LastMessage,
            lastMessageAt = chat.LastMessageAt,
            unreadCount = chat.UnreadCount
        };
        if (receiverConnectionId != null)
        {
            await Clients.Client(receiverConnectionId).SendAsync("ChatUpdated", chatUpdateDto);
        }
    }

    /// <summary>
    /// Marks all messages in a chat as read.
    /// </summary>
    public async Task MarkAsRead(Guid chatId)
    {
        var userId = GetUserId() ?? throw new HubException("Unauthorized");

        var chat = await _context.Chats.FindAsync(chatId);
        if (chat != null && (chat.UserId == userId || chat.ParticipantId == userId))
        {
            chat.UnreadCount = 0;
            await _context.SaveChangesAsync();

            var otherUserId = chat.UserId == userId ? chat.ParticipantId : chat.UserId;
            var otherConnectionId = _userConnections.GetValueOrDefault(otherUserId.ToString());
            if (otherConnectionId != null)
            {
                await Clients.Client(otherConnectionId).SendAsync("MessagesRead", new { chatId });
            }
        }
    }

    /// <summary>
    /// Notifies the other participant that the current user is typing.
    /// </summary>
    public async Task Typing(Guid chatId)
    {
        var userId = GetUserId();
        if (!userId.HasValue) return;

        var chat = await _context.Chats.FindAsync(chatId);
        if (chat == null) return;

        var otherUserId = chat.UserId == userId ? chat.ParticipantId : chat.UserId;
        var otherConnectionId = _userConnections.GetValueOrDefault(otherUserId.ToString());
        if (otherConnectionId != null)
        {
            await Clients.Client(otherConnectionId).SendAsync("UserTyping", new { chatId, userId });
        }
    }

    private Guid? GetUserId()
    {
        var id = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(id, out var userId) ? userId : null;
    }
}
