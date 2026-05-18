namespace Synq.Application.DTOs;

public class CreateReviewRequest
{
    public Guid UserId { get; set; }
    public int Rating { get; set; }
    public string Text { get; set; } = string.Empty;
    public Guid? JobId { get; set; }
}
