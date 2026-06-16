namespace Synq.Domain.Entities;

public class Chat
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ParticipantId { get; set; }
    public Guid? JobId { get; set; }
    public string? LastMessage { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public int UnreadCountByUser { get; set; }
    public int UnreadCountByParticipant { get; set; }
    public DateTime CreatedAt { get; set; }

    public bool IsLeftByUser { get; set; }
    public bool IsLeftByParticipant { get; set; }
    public DateTime? LeftAtByUser { get; set; }
    public DateTime? LeftAtByParticipant { get; set; }

    public User User { get; set; } = null!;
    public User Participant { get; set; } = null!;
    public Job? Job { get; set; }
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
