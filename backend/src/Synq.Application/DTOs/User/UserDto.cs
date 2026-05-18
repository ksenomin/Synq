namespace Synq.Application.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? CoverUrl { get; set; }
    public string? Bio { get; set; }
    public string? Location { get; set; }
    public int? YearsOfExperience { get; set; }
    public bool IsVerified { get; set; }
    public decimal Rating { get; set; }
    public int ReviewsCount { get; set; }
    public int CompletedJobs { get; set; }
    public decimal? HourlyRate { get; set; }
    public string? PortfolioUrl { get; set; }
    public string? PortfolioFileUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}
