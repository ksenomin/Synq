namespace Synq.Application.DTOs;

public class ChatDto
{
    public Guid Id { get; set; }
    public Guid ParticipantId { get; set; }
    public string ParticipantName { get; set; } = string.Empty;
    public string? ParticipantAvatar { get; set; }
    public string? LastMessage { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
    public Guid? JobId { get; set; }
    public string? JobTitle { get; set; }
    public DateTime CreatedAt { get; set; }
}
