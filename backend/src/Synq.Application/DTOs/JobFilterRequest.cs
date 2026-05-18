namespace Synq.Application.DTOs;

public class JobFilterRequest
{
    public string? Search { get; set; }
    public string? Category { get; set; }
    public decimal? BudgetMin { get; set; }
    public decimal? BudgetMax { get; set; }
    public string? SortBy { get; set; } // "newest", "budget", "deadline"
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
