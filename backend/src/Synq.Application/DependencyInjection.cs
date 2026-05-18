using Microsoft.Extensions.DependencyInjection;
using Synq.Application.Services;

namespace Synq.Application;

/// <summary>
/// Extension methods for registering Application layer services.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Registers all Application layer services with scoped lifetime.
    /// </summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<UserService>();
        services.AddScoped<CategoryService>();
        services.AddScoped<JobService>();
        services.AddScoped<ProposalService>();
        services.AddScoped<ChatService>();
        services.AddScoped<PostService>();
        services.AddScoped<ReviewService>();

        return services;
    }
}
