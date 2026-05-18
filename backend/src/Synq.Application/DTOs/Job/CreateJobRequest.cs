namespace Synq.Application.DTOs;

public class CreateJobRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public decimal BudgetMin { get; set; }
    public decimal BudgetMax { get; set; }
    public string BudgetType { get; set; } = string.Empty; // "Fixed" or "Hourly"
    public DateTime? Deadline { get; set; }
    public bool IsUrgent { get; set; }
    public List<string> Skills { get; set; } = new();
}
