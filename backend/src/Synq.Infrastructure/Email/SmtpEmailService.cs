using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Synq.Domain.Interfaces;

namespace Synq.Infrastructure.Email;

/// <summary>
/// SMTP-based email service using MailKit for sending verification emails.
/// Configured for Mailpit in development (no auth, no SSL).
/// </summary>
public class SmtpEmailService : IEmailService
{
    private readonly string _host;
    private readonly int _port;
    private readonly string _from;
    private readonly bool _useSsl;
    private readonly string? _username;
    private readonly string? _password;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _host = config["Smtp:Host"] ?? "localhost";
        _port = int.TryParse(config["Smtp:Port"], out var port) ? port : 1025;
        _from = config["Smtp:From"] ?? "noreply@synq.app";
        _useSsl = bool.TryParse(config["Smtp:UseSsl"], out var ssl) && ssl;
        _username = config["Smtp:Username"];
        _password = config["Smtp:Password"];
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task SendVerificationEmailAsync(string toEmail, string verificationUrl, CancellationToken ct = default)
    {
        _logger.LogInformation("Sending verification email to {Email}", toEmail);

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("SYNQ", _from));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Подтверждение аккаунта SYNQ";

        var body = $@"
            <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"">
                <h2 style=""color: #6366f1;"">Подтверждение аккаунта SYNQ</h2>
                <p>Здравствуйте!</p>
                <p>Для подтверждения вашего аккаунта нажмите на кнопку ниже:</p>
                <p style=""text-align: center; margin: 30px 0;"">
                    <a href=""{verificationUrl}""
                       style=""background-color: #6366f1; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 6px; display: inline-block;"">
                        Подтвердить аккаунт
                    </a>
                </p>
                <p>Или скопируйте ссылку в браузер:</p>
                <p style=""word-break: break-all; color: #6366f1;"">{verificationUrl}</p>
                <hr style=""border: none; border-top: 1px solid #eee; margin: 20px 0;"" />
                <p style=""color: #999; font-size: 12px;"">
                    Если вы не регистрировались на SYNQ, просто проигнорируйте это письмо.
                </p>
            </div>";

        message.Body = new BodyBuilder { HtmlBody = body }.ToMessageBody();

        using var client = new SmtpClient();

        var secureOption = _useSsl
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.None;

        await client.ConnectAsync(_host, _port, secureOption, ct);

        if (!string.IsNullOrEmpty(_username) && !string.IsNullOrEmpty(_password))
        {
            await client.AuthenticateAsync(_username, _password, ct);
        }

        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);

        _logger.LogInformation("Verification email sent successfully to {Email}", toEmail);
    }
}