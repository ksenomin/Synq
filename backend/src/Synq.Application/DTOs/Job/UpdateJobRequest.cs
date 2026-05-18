namespace Synq.Application.DTOs;

public class UpdateJobRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public Guid? CategoryId { get; set; }
    public decimal? BudgetMin { get; set; }
    public decimal? BudgetMax { get; set; }
    public string? BudgetType { get; set; }
    public DateTime? Deadline { get; set; }
    public bool? IsUrgent { get; set; }
    public List<string>? Skills { get; set; }
}
