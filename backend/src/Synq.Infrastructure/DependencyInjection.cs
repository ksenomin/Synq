using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Synq.Domain.Interfaces;
using Synq.Infrastructure.Data;
using Synq.Infrastructure.Email;
using Synq.Infrastructure.Storage;

namespace Synq.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(config.GetConnectionString("DefaultConnection")));

        services.AddSingleton<IFileStorage, LocalFileStorage>();
        services.AddScoped<IEmailService, SmtpEmailService>();

        return services;
    }
}
