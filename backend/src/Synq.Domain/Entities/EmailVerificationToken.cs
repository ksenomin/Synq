namespace Synq.Domain.Entities;

/// <summary>
/// Represents a token used for email verification during user registration.
/// </summary>
public class EmailVerificationToken
{
    /// <summary>
    /// Unique identifier for the verification token.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The user this verification token belongs to.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Crypto-random base64 token string used for verification.
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Expiration timestamp for the verification token.
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Indicates whether this token has already been used.
    /// </summary>
    public bool IsUsed { get; set; }

    /// <summary>
    /// Timestamp when the token was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Navigation property to the user.
    /// </summary>
    public User User { get; set; } = null!;
}