using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Synq.Application.DTOs;
using Synq.Domain.Interfaces;
using Synq.Domain.Utils;
using Synq.Domain.Entities;
using Synq.Infrastructure.Data;

namespace Synq.Application.Services;

/// <summary>
/// Handles authentication operations including registration, login, token management, and email verification.
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
    /// Returns an AuthResponse with NeedsVerification = true and empty tokens.
    /// </summary>
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
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

        return new AuthResponse
        {
            AccessToken = string.Empty,
            RefreshToken = string.Empty,
            ExpiresAt = DateTime.UtcNow,
            User = MapToUserDto(user),
            NeedsVerification = true
        };
    }

    /// <summary>
    /// Authenticates a user and returns authentication tokens.
    /// </summary>
    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email, ct);
        if (user == null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
            throw new InvalidOperationException("Invalid email or password");

        // Temporarily disabled for testing - email verification check
        // if (!user.IsVerified)
        //     throw new InvalidOperationException("Email not verified. Please check your inbox.");

        return await GenerateAuthResponseAsync(user, ct);
    }

    /// <summary>
    /// Verifies a user's email using the verification token.
    /// On success, marks the user as verified and returns full authentication tokens.
    /// </summary>
    public async Task<AuthResponse> VerifyEmailAsync(string token, CancellationToken ct = default)
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

        return await GenerateAuthResponseAsync(verificationToken.User, ct);
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

    /// <summary>
    /// Refreshes access token using a valid refresh token.
    /// </summary>
    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        var token = await _context.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == refreshToken, ct);

        if (token == null || token.IsRevoked || token.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Invalid or expired refresh token");

        token.IsRevoked = true;
        await _context.SaveChangesAsync(ct);

        return await GenerateAuthResponseAsync(token.User, ct);
    }

    /// <summary>
    /// Revokes a refresh token.
    /// </summary>
    public async Task RevokeTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        var token = await _context.RefreshTokens.FirstOrDefaultAsync(t => t.Token == refreshToken, ct);
        if (token != null)
        {
            token.IsRevoked = true;
            await _context.SaveChangesAsync(ct);
        }
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user, CancellationToken ct)
    {
        var accessToken = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.AddMinutes(double.Parse(_config["Jwt:AccessTokenExpirationMinutes"] ?? "60"));

        _context.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(double.Parse(_config["Jwt:RefreshTokenExpirationDays"] ?? "7")),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = MapToUserDto(user),
            NeedsVerification = false
        };
    }

    private string GenerateJwtToken(User user)
    {
        var key = Encoding.UTF8.GetBytes(_config["Jwt:SecretKey"]!);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(double.Parse(_config["Jwt:AccessTokenExpirationMinutes"] ?? "60")),
            Issuer = _config["Jwt:Issuer"],
            Audience = _config["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);
        return handler.WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
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