namespace Synq.Domain.Entities;

public class Review
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AuthorId { get; set; }
    public int Rating { get; set; }
    public string Text { get; set; } = string.Empty;
    public Guid? JobId { get; set; }
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
    public User Author { get; set; } = null!;
    public Job? Job { get; set; }
}
