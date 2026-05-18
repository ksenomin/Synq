namespace Synq.Application.DTOs;

public class ReviewDto
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorAvatar { get; set; }
    public int Rating { get; set; }
    public string Text { get; set; } = string.Empty;
    public Guid? JobId { get; set; }
    public string? JobTitle { get; set; }
    public DateTime CreatedAt { get; set; }
}
