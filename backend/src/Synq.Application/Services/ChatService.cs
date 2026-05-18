using Microsoft.EntityFrameworkCore;
using Synq.Application.DTOs;
using Synq.Infrastructure.Data;

namespace Synq.Application.Services;

/// <summary>
/// Handles chat and messaging operations.
/// </summary>
public class ChatService
{
    private readonly AppDbContext _context;

    public ChatService(AppDbContext context) => _context = context;

    /// <summary>
    /// Gets all chats for a specific user.
    /// </summary>
    public async Task<List<ChatDto>> GetByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        await _context.Chats
            .Include(c => c.Participant)
            .Include(c => c.Job)
            .Where(c => c.UserId == userId || c.ParticipantId == userId)
            .OrderByDescending(c => c.LastMessageAt)
            .Select(c => new ChatDto
            {
                Id = c.Id,
                ParticipantId = c.UserId == userId ? c.ParticipantId : c.UserId,
                ParticipantName = c.UserId == userId ? c.Participant.Name : c.User.Name,
                ParticipantAvatar = c.UserId == userId ? c.Participant.AvatarUrl : c.User.AvatarUrl,
                LastMessage = c.LastMessage,
                LastMessageAt = c.LastMessageAt,
                UnreadCount = c.UnreadCount,
                JobId = c.JobId,
                JobTitle = c.Job != null ? c.Job.Title : null,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync(ct);

    /// <summary>
    /// Creates a new chat or returns existing one between two users.
    /// </summary>
    public async Task<ChatDto> CreateAsync(Guid userId, CreateChatRequest request, CancellationToken ct = default)
    {
        var existing = await _context.Chats
            .FirstOrDefaultAsync(c =>
                (c.UserId == userId && c.ParticipantId == request.ParticipantId) ||
                (c.UserId == request.ParticipantId && c.ParticipantId == userId), ct);

        if (existing != null)
            return await GetDtoAsync(existing.Id, ct);

        var chat = new Domain.Entities.Chat
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ParticipantId = request.ParticipantId,
            JobId = request.JobId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Chats.Add(chat);
        await _context.SaveChangesAsync(ct);

        return await GetDtoAsync(chat.Id, ct);
    }

    /// <summary>
    /// Gets paginated messages for a specific chat.
    /// </summary>
    public async Task<PagedResult<MessageDto>> GetMessagesAsync(Guid chatId, Guid userId, int page, int pageSize, CancellationToken ct = default)
    {
        var chat = await _context.Chats.FindAsync(new object[] { chatId }, cancellationToken: ct);
        if (chat == null || (chat.UserId != userId && chat.ParticipantId != userId))
            throw new UnauthorizedAccessException("Access denied");

        var query = _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ChatId == chatId)
            .OrderBy(m => m.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                ChatId = m.ChatId,
                SenderId = m.SenderId,
                SenderName = m.Sender.Name,
                SenderAvatar = m.Sender.AvatarUrl,
                Text = m.Text,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync(ct);

        return new PagedResult<MessageDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    /// <summary>
    /// Sends a message in a chat.
    /// </summary>
    public async Task<MessageDto> SendMessageAsync(Guid chatId, Guid senderId, string text, CancellationToken ct = default)
    {
        var chat = await _context.Chats.FindAsync(new object[] { chatId }, cancellationToken: ct);
        if (chat == null || (chat.UserId != senderId && chat.ParticipantId != senderId))
            throw new UnauthorizedAccessException("Access denied");

        var message = new Domain.Entities.Message
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
        if (chat.UserId != senderId)
            chat.UnreadCount++;

        await _context.SaveChangesAsync(ct);

        var sender = await _context.Users.FindAsync(new object[] { senderId }, cancellationToken: ct);
        return new MessageDto
        {
            Id = message.Id,
            ChatId = chatId,
            SenderId = senderId,
            SenderName = sender!.Name,
            SenderAvatar = sender.AvatarUrl,
            Text = text,
            CreatedAt = message.CreatedAt
        };
    }

    /// <summary>
    /// Marks all messages in a chat as read.
    /// </summary>
    public async Task MarkAsReadAsync(Guid chatId, Guid userId, CancellationToken ct = default)
    {
        var chat = await _context.Chats.FindAsync(new object[] { chatId }, cancellationToken: ct);
        if (chat != null && (chat.UserId == userId || chat.ParticipantId == userId))
        {
            chat.UnreadCount = 0;
            await _context.SaveChangesAsync(ct);
        }
    }

    private async Task<ChatDto> GetDtoAsync(Guid chatId, CancellationToken ct)
    {
        var chat = await _context.Chats
            .Include(c => c.User)
            .Include(c => c.Participant)
            .Include(c => c.Job)
            .FirstOrDefaultAsync(c => c.Id == chatId, ct)
            ?? throw new KeyNotFoundException("Chat not found");

        var isCurrentUser = chat.UserId;
        return new ChatDto
        {
            Id = chat.Id,
            ParticipantId = isCurrentUser == chat.UserId ? chat.ParticipantId : chat.UserId,
            ParticipantName = isCurrentUser == chat.UserId ? chat.Participant.Name : chat.User.Name,
            ParticipantAvatar = isCurrentUser == chat.UserId ? chat.Participant.AvatarUrl : chat.User.AvatarUrl,
            LastMessage = chat.LastMessage,
            LastMessageAt = chat.LastMessageAt,
            UnreadCount = chat.UnreadCount,
            JobId = chat.JobId,
            JobTitle = chat.Job?.Title,
            CreatedAt = chat.CreatedAt
        };
    }
}
