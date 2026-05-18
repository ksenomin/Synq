namespace Synq.Application.DTOs;

public class UpdateUserRequest
{
    public string? Name { get; set; }
    public string? Bio { get; set; }
    public string? Location { get; set; }
    public int? YearsOfExperience { get; set; }
    public decimal? HourlyRate { get; set; }
    public string? PortfolioUrl { get; set; }
}
