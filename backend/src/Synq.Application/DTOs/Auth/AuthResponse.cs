namespace Synq.Application.DTOs;

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserDto User { get; set; } = null!;

    /// <summary>
    /// Indicates whether the user needs to verify their email before full access is granted.
    /// </summary>
    public bool NeedsVerification { get; set; }
}
