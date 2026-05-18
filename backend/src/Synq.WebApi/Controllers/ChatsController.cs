using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synq.Application.DTOs;
using Synq.Application.Services;

namespace Synq.WebApi.Controllers;

/// <summary>
/// Manages chat conversations and messaging.
/// </summary>
public class ChatsController : BaseController
{
    private readonly ChatService _service;

    public ChatsController(ChatService service) => _service = service;

    /// <summary>
    /// Gets all chats for the current user.
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetMyChats(CancellationToken ct)
    {
        var chats = await _service.GetByUserIdAsync(GetCurrentUserId(), ct);
        return Ok(chats);
    }

    /// <summary>
    /// Creates a new chat conversation.
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateChatRequest request, CancellationToken ct)
    {
        var chat = await _service.CreateAsync(GetCurrentUserId(), request, ct);
        return Ok(chat);
    }

    /// <summary>
    /// Gets paginated messages for a specific chat.
    /// </summary>
    [HttpGet("{id:guid}/messages")]
    [Authorize]
    public async Task<IActionResult> GetMessages(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        try
        {
            var result = await _service.GetMessagesAsync(id, GetCurrentUserId(), page, pageSize, ct);
            return OkPaginated(result.Items, result.TotalCount, result.Page, result.PageSize);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Sends a message in a chat.
    /// </summary>
    [HttpPost("{id:guid}/messages")]
    [Authorize]
    public async Task<IActionResult> SendMessage(Guid id, [FromBody] SendMessageRequest request, CancellationToken ct)
    {
        try
        {
            var message = await _service.SendMessageAsync(id, GetCurrentUserId(), request.Text, ct);
            return Ok(message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Marks all messages in a chat as read for the current user.
    /// </summary>
    [HttpPost("{id:guid}/read")]
    [Authorize]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        await _service.MarkAsReadAsync(id, GetCurrentUserId(), ct);
        return Ok(new { message = "Marked as read" });
    }
}
