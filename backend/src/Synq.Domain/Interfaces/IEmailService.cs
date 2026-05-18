namespace Synq.Domain.Interfaces;

/// <summary>
/// Provides abstraction for sending email messages.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends a verification email with a confirmation link.
    /// </summary>
    /// <param name="toEmail">The recipient email address.</param>
    /// <param name="verificationUrl">The full URL the user should click to verify their email.</param>
    /// <param name="ct">Cancellation token.</param>
    Task SendVerificationEmailAsync(string toEmail, string verificationUrl, CancellationToken ct = default);
}