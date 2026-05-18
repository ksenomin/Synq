using Synq.Domain.Entities;

namespace Synq.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Domain.Enums.UserRole Role { get; set; }
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

    // Navigation
    public ICollection<Job> Jobs { get; set; } = new List<Job>();
    public ICollection<Proposal> Proposals { get; set; } = new List<Proposal>();
    public ICollection<Post> Posts { get; set; } = new List<Post>();
    public ICollection<Review> ReviewsReceived { get; set; } = new List<Review>();
    public ICollection<Review> ReviewsWritten { get; set; } = new List<Review>();
    public ICollection<Chat> ChatsAsUser { get; set; } = new List<Chat>();
    public ICollection<Chat> ChatsAsParticipant { get; set; } = new List<Chat>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<EmailVerificationToken> EmailVerificationTokens { get; set; } = new List<EmailVerificationToken>();
}
