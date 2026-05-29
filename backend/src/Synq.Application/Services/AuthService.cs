using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Synq.Application.DTOs;
using Synq.Domain.Interfaces;
using Synq.Domain.Utils;
using Synq.Domain.Entities;
using Synq.Infrastructure.Data;

namespace Synq.Application.Services;

/// <summary>
/// Handles authentication operations including registration, login, and email verification.
/// </summary>
public class AuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AppDbContext context, IConfiguration config, IEmailService emailService, ILogger<AuthService> logger)
    {
        _context = context;
        _config = config;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Registers a new user and sends a verification email.
    /// Returns a user DTO with NeedsVerification = true.
    /// </summary>
    public async Task<(UserDto User, bool NeedsVerification)> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email, ct))
            throw new InvalidOperationException("Email already registered");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            Name = request.Name,
            Role = Enum.Parse<Domain.Enums.UserRole>(request.Role, true),
            IsVerified = false,
            PasswordHash = PasswordHasher.Hash(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        var verificationToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = GenerateVerificationToken(),
            ExpiresAt = DateTime.UtcNow.AddHours(int.Parse(_config["EmailVerification:TokenExpirationHours"] ?? "24")),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        _context.EmailVerificationTokens.Add(verificationToken);
        await _context.SaveChangesAsync(ct);

        var baseUrl = _config["EmailVerification:BaseVerificationUrl"] ?? "http://localhost:3000/verify-email";
        var verificationUrl = $"{baseUrl}?token={Uri.EscapeDataString(verificationToken.Token)}";

        try
        {
            await _emailService.SendVerificationEmailAsync(user.Email, verificationUrl, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", user.Email);
        }

        return (MapToUserDto(user), true);
    }

    /// <summary>
    /// Authenticates a user and returns the user DTO together with a verification flag.
    /// </summary>
    public async Task<(UserDto User, bool NeedsVerification)> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email, ct);
        if (user == null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
            throw new InvalidOperationException("Invalid email or password");

        return (MapToUserDto(user), !user.IsVerified);
    }

    /// <summary>
    /// Verifies a user's email using the verification token.
    /// On success, marks the user as verified and returns the user DTO.
    /// </summary>
    public async Task<UserDto> VerifyEmailAsync(string token, CancellationToken ct = default)
    {
        var verificationToken = await _context.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed, ct);

        if (verificationToken == null)
            throw new InvalidOperationException("Invalid or already used verification token");

        if (verificationToken.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Verification token has expired");

        verificationToken.IsUsed = true;
        verificationToken.User.IsVerified = true;

        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new InvalidOperationException("Token already used");
        }

        return MapToUserDto(verificationToken.User);
    }

    /// <summary>
    /// Resends a verification email to the specified address, invalidating any existing tokens.
    /// </summary>
    public async Task ResendVerificationAsync(string email, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, ct)
            ?? throw new InvalidOperationException("User not found");

        if (user.IsVerified)
            throw new InvalidOperationException("Email already verified");

        // Invalidate existing tokens
        var existingTokens = await _context.EmailVerificationTokens
            .Where(t => t.UserId == user.Id && !t.IsUsed)
            .ToListAsync(ct);
        foreach (var t in existingTokens)
            t.IsUsed = true;

        var verificationToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = GenerateVerificationToken(),
            ExpiresAt = DateTime.UtcNow.AddHours(int.Parse(_config["EmailVerification:TokenExpirationHours"] ?? "24")),
            CreatedAt = DateTime.UtcNow
        };

        _context.EmailVerificationTokens.Add(verificationToken);
        await _context.SaveChangesAsync(ct);

        var verificationUrl = $"{_config["EmailVerification:BaseVerificationUrl"] ?? "http://localhost:3000/verify-email"}?token={Uri.EscapeDataString(verificationToken.Token)}";
        try
        {
            await _emailService.SendVerificationEmailAsync(user.Email, verificationUrl, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", user.Email);
            throw new InvalidOperationException("Failed to send verification email. Please try again later.");
        }
    }

    private static string GenerateVerificationToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }

    private static UserDto MapToUserDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Name = user.Name,
        Role = user.Role.ToString(),
        AvatarUrl = user.AvatarUrl,
        CoverUrl = user.CoverUrl,
        Bio = user.Bio,
        Location = user.Location,
        YearsOfExperience = user.YearsOfExperience,
        IsVerified = user.IsVerified,
        Rating = user.Rating,
        ReviewsCount = user.ReviewsCount,
        CompletedJobs = user.CompletedJobs,
        HourlyRate = user.HourlyRate,
        PortfolioUrl = user.PortfolioUrl,
        PortfolioFileUrl = user.PortfolioFileUrl,
        CreatedAt = user.CreatedAt
    };
}
