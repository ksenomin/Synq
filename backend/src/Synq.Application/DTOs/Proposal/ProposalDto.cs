namespace Synq.Application.DTOs;

public class ProposalDto
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public string? JobTitle { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public Guid ClientId { get; set; }
    public string? ClientName { get; set; }
    public string? ClientAvatar { get; set; }
    public string? JobStatus { get; set; }
    public decimal Price { get; set; }
    public int DeadlineDays { get; set; }
    public string CoverLetter { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}
