using System.Reflection;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Synq.Application;
using Synq.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Infrastructure
builder.Services.AddInfrastructure(builder.Configuration);

// Application
builder.Services.AddApplication();

// Cookie Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "synq_session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
        options.LoginPath = "/auth";
        options.AccessDeniedPath = "/auth";

        options.Events.OnRedirectToLogin = context =>
        {
            // For API requests return 401 instead of redirect
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            }
            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };
    });

// SignalR
builder.Services.AddSignalR();

// Controllers
builder.Services.AddControllers();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://0.0.0.0:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // No JWT security definition needed for cookie auth
});

var app = builder.Build();

// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<Synq.Infrastructure.Data.AppDbContext>();
    await context.Database.MigrateAsync();

    // Seed data
    await SeedDataAsync(context, scope.ServiceProvider);
}

async Task SeedDataAsync(Synq.Infrastructure.Data.AppDbContext ctx, IServiceProvider sp)
{
    var hashMethod = typeof(Synq.Domain.Utils.PasswordHasher).GetMethod("Hash", BindingFlags.Public | BindingFlags.Static);
    var passwordHash = (string)hashMethod!.Invoke(null, new object[] { "password123" })!;

    if (!ctx.Users.Any())
    {
        var client = new Synq.Domain.Entities.User
        {
            Id = Guid.NewGuid(),
            Email = "client@synq.app",
            Name = "Ольга Новикова",
            Role = Synq.Domain.Enums.UserRole.Client,
            IsVerified = true,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow,
            Rating = 4.5m,
            ReviewsCount = 34,
            CompletedJobs = 12,
            Location = "Москва, Россия",
            AvatarUrl = "https://i.pravatar.cc/150?u=6",
            CoverUrl = null,
        };

        var freelancer = new Synq.Domain.Entities.User
        {
            Id = Guid.NewGuid(),
            Email = "freelancer@synq.app",
            Name = "Алексей Петров",
            Role = Synq.Domain.Enums.UserRole.Freelancer,
            IsVerified = true,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow,
            Rating = 4.9m,
            ReviewsCount = 127,
            CompletedJobs = 156,
            HourlyRate = 3500,
            Location = "Москва, Россия",
            Bio = "Senior UI/UX дизайнер с 8-летним опытом.",
            AvatarUrl = "https://i.pravatar.cc/150?u=1",
            CoverUrl = "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=400&fit=crop",
        };

        ctx.Users.AddRange(client, freelancer);
        await ctx.SaveChangesAsync();
    }
    // Seed data block intentionally left empty to avoid auto-assigning mock avatars
    // to newly registered users on subsequent application starts.

    if (!ctx.Categories.Any())
    {
        var categories = new[]
        {
            new Synq.Domain.Entities.Category { Id = Guid.NewGuid(), Name = "Веб-дизайн", Slug = "web-design", Icon = "Layout", Description = "Дизайн сайтов, лендингов и веб-приложений", Color = "from-blue-500 to-cyan-400" },
            new Synq.Domain.Entities.Category { Id = Guid.NewGuid(), Name = "UI/UX Дизайн", Slug = "ui-ux", Icon = "Palette", Description = "Проектирование пользовательских интерфейсов", Color = "from-purple-500 to-pink-400" },
            new Synq.Domain.Entities.Category { Id = Guid.NewGuid(), Name = "Графический дизайн", Slug = "graphic-design", Icon = "PenTool", Description = "Логотипы, баннеры, печатная продукция", Color = "from-orange-500 to-yellow-400" },
            new Synq.Domain.Entities.Category { Id = Guid.NewGuid(), Name = "Motion Design", Slug = "motion", Icon = "Film", Description = "Анимация, видео, моушн-графика", Color = "from-green-500 to-emerald-400" },
            new Synq.Domain.Entities.Category { Id = Guid.NewGuid(), Name = "Разработка", Slug = "development", Icon = "Code", Description = "Frontend, backend, мобильная разработка", Color = "from-indigo-500 to-blue-400" },
            new Synq.Domain.Entities.Category { Id = Guid.NewGuid(), Name = "3D Дизайн", Slug = "3d", Icon = "Box", Description = "3D моделирование, визуализация, анимация", Color = "from-red-500 to-orange-400" },
        };
        ctx.Categories.AddRange(categories);
        await ctx.SaveChangesAsync();
    }

    if (!ctx.Skills.Any())
    {
        var skills = new[]
        {
            "Figma", "UI/UX", "E-commerce", "Responsive Design", "React",
            "TypeScript", "Node.js", "Python", "After Effects", "Blender",
            "Photoshop", "Illustrator", "CSS", "HTML", "TailwindCSS",
        };
        ctx.Skills.AddRange(skills.Select(name => new Synq.Domain.Entities.Skill { Name = name }));
        await ctx.SaveChangesAsync();
    }

    if (!ctx.Jobs.Any())
    {
        var firstClient = ctx.Users.First(u => u.Role == Synq.Domain.Enums.UserRole.Client);
        var webDesignCat = ctx.Categories.First(c => c.Slug == "web-design");
        var devCat = ctx.Categories.First(c => c.Slug == "development");
        var motionCat = ctx.Categories.First(c => c.Slug == "motion");
        var graphicCat = ctx.Categories.First(c => c.Slug == "graphic-design");
        var uiuxCat = ctx.Categories.First(c => c.Slug == "ui-ux");
        var threeDCat = ctx.Categories.First(c => c.Slug == "3d");

        var jobs = new[]
        {
            new Synq.Domain.Entities.Job { Id = Guid.NewGuid(), Title = "Редизайн интернет-магазина", Description = "Нужен полный редизайн интернет-магазина одежды. Текущий сайт устарел и не конвертирует. Требуется: главная страница, каталог, карточка товара, корзина, оформление заказа. Дизайн в Figma с адаптивом для мобильных.", CategoryId = webDesignCat.Id, BudgetMin = 80000, BudgetMax = 150000, BudgetType = Synq.Domain.Enums.BudgetType.Fixed, Deadline = DateTime.UtcNow.AddDays(30), IsUrgent = true, Status = Synq.Domain.Enums.JobStatus.Open, ClientId = firstClient.Id, CreatedAt = DateTime.UtcNow.AddDays(-10) },
            new Synq.Domain.Entities.Job { Id = Guid.NewGuid(), Title = "Разработка CRM системы", Description = "Разработка CRM системы для управления клиентами и проектами. Стек: React + Node.js + PostgreSQL. Требуется: дашборд, управление контактами, воронка продаж, отчеты, интеграция с почтой и мессенджерами.", CategoryId = devCat.Id, BudgetMin = 200000, BudgetMax = 400000, BudgetType = Synq.Domain.Enums.BudgetType.Fixed, Deadline = DateTime.UtcNow.AddDays(90), IsUrgent = false, Status = Synq.Domain.Enums.JobStatus.Open, ClientId = firstClient.Id, CreatedAt = DateTime.UtcNow.AddDays(-12) },
            new Synq.Domain.Entities.Job { Id = Guid.NewGuid(), Title = "Анимация для мобильного приложения", Description = "Нужно создать набор анимаций для мобильного фитнес-приложения: onboarding, переходы между экранами, микроанимации кнопок, анимация прогресса. Формат: Lottie JSON.", CategoryId = motionCat.Id, BudgetMin = 30000, BudgetMax = 60000, BudgetType = Synq.Domain.Enums.BudgetType.Fixed, Deadline = DateTime.UtcNow.AddDays(15), IsUrgent = true, Status = Synq.Domain.Enums.JobStatus.Open, ClientId = firstClient.Id, CreatedAt = DateTime.UtcNow.AddDays(-8) },
            new Synq.Domain.Entities.Job { Id = Guid.NewGuid(), Title = "Логотип и фирменный стиль", Description = "Создание логотипа и фирменного стиля для нового стартапа в сфере EdTech. Нужен: логотип (основной + упрощенный), цветовая палитра, типографика, паттерны, шаблоны для соцсетей.", CategoryId = graphicCat.Id, BudgetMin = 40000, BudgetMax = 80000, BudgetType = Synq.Domain.Enums.BudgetType.Fixed, Deadline = DateTime.UtcNow.AddDays(45), IsUrgent = false, Status = Synq.Domain.Enums.JobStatus.Open, ClientId = firstClient.Id, CreatedAt = DateTime.UtcNow.AddDays(-15) },
            new Synq.Domain.Entities.Job { Id = Guid.NewGuid(), Title = "Дизайн мобильного банка", Description = "Дизайн мобильного приложения для необанка. 25+ экранов: онбординг, главный экран, переводы, история операций, настройки, поддержка. Строгий стиль, минимализм, доступность.", CategoryId = uiuxCat.Id, BudgetMin = 120000, BudgetMax = 200000, BudgetType = Synq.Domain.Enums.BudgetType.Fixed, Deadline = DateTime.UtcNow.AddDays(60), IsUrgent = false, Status = Synq.Domain.Enums.JobStatus.Open, ClientId = firstClient.Id, CreatedAt = DateTime.UtcNow.AddDays(-5) },
            new Synq.Domain.Entities.Job { Id = Guid.NewGuid(), Title = "3D визуализация продукта", Description = "Создание 3D моделей и рендеров для каталога мебели. 10 предметов: диваны, столы, стулья, шкафы. Фотореалистичные рендеры на белом фоне и в интерьере.", CategoryId = threeDCat.Id, BudgetMin = 50000, BudgetMax = 90000, BudgetType = Synq.Domain.Enums.BudgetType.Fixed, Deadline = DateTime.UtcNow.AddDays(40), IsUrgent = false, Status = Synq.Domain.Enums.JobStatus.Open, ClientId = firstClient.Id, CreatedAt = DateTime.UtcNow.AddDays(-9) },
        };

        ctx.Jobs.AddRange(jobs);
        await ctx.SaveChangesAsync();

        // Add job skills
        var jobSkills = new List<Synq.Domain.Entities.JobSkill>();
        var jobSkillsData = new Dictionary<string, string[]>
        {
            { jobs[0].Id.ToString(), new[] { "Figma", "UI/UX", "E-commerce", "Responsive Design" } },
            { jobs[1].Id.ToString(), new[] { "React", "TypeScript", "Node.js" } },
            { jobs[2].Id.ToString(), new[] { "After Effects", "UI/UX" } },
            { jobs[3].Id.ToString(), new[] { "Photoshop", "Illustrator" } },
            { jobs[4].Id.ToString(), new[] { "UI/UX", "Figma", "TailwindCSS" } },
            { jobs[5].Id.ToString(), new[] { "Blender", "Photoshop" } },
        };

        foreach (var (jobIdStr, skillNames) in jobSkillsData)
        {
            var jobId = Guid.Parse(jobIdStr);
            foreach (var skillName in skillNames)
            {
                jobSkills.Add(new Synq.Domain.Entities.JobSkill { JobId = jobId, SkillName = skillName });
            }
        }

        ctx.JobSkills.AddRange(jobSkills);
        await ctx.SaveChangesAsync();
    }
}

// Ensure uploads directory exists
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
    Directory.CreateDirectory(uploadsPath);

// Serve static files from uploads
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "uploads")),
    RequestPath = "/uploads"
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapHub<Synq.WebApi.Hubs.ChatHub>("/chatHub");
app.MapControllers();

app.Run();
