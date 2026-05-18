namespace Synq.Application.DTOs;

public class JobDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public decimal BudgetMin { get; set; }
    public decimal BudgetMax { get; set; }
    public string BudgetType { get; set; } = string.Empty;
    public DateTime? Deadline { get; set; }
    public bool IsUrgent { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientAvatar { get; set; }
    public List<string> Skills { get; set; } = new();
    public List<JobAttachmentDto> Attachments { get; set; } = new();
    public int ProposalsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
