using Microsoft.EntityFrameworkCore;
using Synq.Domain.Entities;

namespace Synq.Infrastructure.Data;

/// <summary>
/// Main EF Core DbContext for the SYNQ application.
/// Configures all entity mappings, relationships, and constraints.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<JobSkill> JobSkills => Set<JobSkill>();
    public DbSet<JobAttachment> JobAttachments => Set<JobAttachment>();
    public DbSet<Proposal> Proposals => Set<Proposal>();
    public DbSet<ProposalSkill> ProposalSkills => Set<ProposalSkill>();
    public DbSet<Chat> Chats => Set<Chat>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Email).HasMaxLength(256).IsRequired();
            b.HasIndex(x => x.Email).IsUnique();
            b.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();
            b.Property(x => x.Name).HasMaxLength(128).IsRequired();
            b.Property(x => x.Role).HasConversion<string>().HasMaxLength(32);
            b.Property(x => x.AvatarUrl).HasMaxLength(1024);
            b.Property(x => x.CoverUrl).HasMaxLength(1024);
            b.Property(x => x.Bio).HasMaxLength(2000);
            b.Property(x => x.Location).HasMaxLength(256);
            b.Property(x => x.PortfolioUrl).HasMaxLength(1024);
            b.Property(x => x.PortfolioFileUrl).HasMaxLength(1024);
            b.Property(x => x.Rating).HasPrecision(2, 1);
            b.Property(x => x.HourlyRate).HasPrecision(10, 2);
            b.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        });

        // Category
        modelBuilder.Entity<Category>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(128).IsRequired();
            b.Property(x => x.Slug).HasMaxLength(128).IsRequired();
            b.HasIndex(x => x.Slug).IsUnique();
            b.Property(x => x.Icon).HasMaxLength(64);
            b.Property(x => x.Description).HasMaxLength(1000);
            b.Property(x => x.ImageUrl).HasMaxLength(1024);
            b.Property(x => x.Color).HasMaxLength(64);
        });

        // Job
        modelBuilder.Entity<Job>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(256).IsRequired();
            b.Property(x => x.Description).HasMaxLength(5000).IsRequired();
            b.Property(x => x.BudgetMin).HasPrecision(10, 2);
            b.Property(x => x.BudgetMax).HasPrecision(10, 2);
            b.Property(x => x.BudgetType).HasConversion<string>().HasMaxLength(32);
            b.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            b.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

            b.HasOne(x => x.Category).WithMany(x => x.Jobs).HasForeignKey(x => x.CategoryId);
            b.HasOne(x => x.Client).WithMany(x => x.Jobs).HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Restrict);
        });

        // Skill
        modelBuilder.Entity<Skill>(b =>
        {
            b.HasKey(x => x.Name);
            b.Property(x => x.Name).HasMaxLength(64).IsRequired();
        });

        // JobSkill
        modelBuilder.Entity<JobSkill>(b =>
        {
            b.HasKey(x => new { x.JobId, x.SkillName });
            b.HasOne(x => x.Job).WithMany(x => x.JobSkills).HasForeignKey(x => x.JobId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Skill).WithMany(x => x.JobSkills).HasForeignKey(x => x.SkillName).OnDelete(DeleteBehavior.Cascade);
        });

        // JobAttachment
        modelBuilder.Entity<JobAttachment>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.FileName).HasMaxLength(256).IsRequired();
            b.Property(x => x.FileUrl).HasMaxLength(1024).IsRequired();
            b.HasOne(x => x.Job).WithMany(x => x.Attachments).HasForeignKey(x => x.JobId).OnDelete(DeleteBehavior.Cascade);
        });

        // Proposal
        modelBuilder.Entity<Proposal>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.CoverLetter).HasMaxLength(3000).IsRequired();
            b.Property(x => x.Price).HasPrecision(10, 2);
            b.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            b.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

            b.HasOne(x => x.Job).WithMany(x => x.Proposals).HasForeignKey(x => x.JobId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.User).WithMany(x => x.Proposals).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        // ProposalSkill
        modelBuilder.Entity<ProposalSkill>(b =>
        {
            b.HasKey(x => new { x.ProposalId, x.SkillName });
            b.HasOne(x => x.Proposal).WithMany(x => x.ProposalSkills).HasForeignKey(x => x.ProposalId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Skill).WithMany(x => x.ProposalSkills).HasForeignKey(x => x.SkillName).OnDelete(DeleteBehavior.Cascade);
        });

        // Chat
        modelBuilder.Entity<Chat>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.LastMessage).HasMaxLength(500);
            b.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

            b.Property(x => x.LastMessage).HasMaxLength(500);
            b.Property(x => x.IsLeftByUser).HasDefaultValue(false);
            b.Property(x => x.IsLeftByParticipant).HasDefaultValue(false);
            b.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

            b.HasOne(x => x.User).WithMany(x => x.ChatsAsUser).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Participant).WithMany(x => x.ChatsAsParticipant).HasForeignKey(x => x.ParticipantId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Job).WithMany(x => x.Chats).HasForeignKey(x => x.JobId).OnDelete(DeleteBehavior.SetNull);
        });

        // Message
        modelBuilder.Entity<Message>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Text).HasMaxLength(5000).IsRequired();
            b.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

            b.HasOne(x => x.Chat).WithMany(x => x.Messages).HasForeignKey(x => x.ChatId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Sender).WithMany(x => x.Messages).HasForeignKey(x => x.SenderId).OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(x => x.ChatId);
            b.HasIndex(x => new { x.ChatId, x.CreatedAt });
        });

        // Post
        modelBuilder.Entity<Post>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(256).IsRequired();
            b.Property(x => x.Content).HasMaxLength(5000).IsRequired();
            b.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

            b.HasOne(x => x.User).WithMany(x => x.Posts).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // Review
        modelBuilder.Entity<Review>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Text).HasMaxLength(2000).IsRequired();
            b.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

            b.HasOne(x => x.User).WithMany(x => x.ReviewsReceived).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Author).WithMany(x => x.ReviewsWritten).HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Job).WithMany().HasForeignKey(x => x.JobId).OnDelete(DeleteBehavior.SetNull);
        });

        // RefreshToken
        modelBuilder.Entity<RefreshToken>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Token).HasMaxLength(512).IsRequired();
            b.HasIndex(x => x.Token).IsUnique();
            b.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

            b.HasOne(x => x.User).WithMany(x => x.RefreshTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // EmailVerificationToken
        modelBuilder.Entity<EmailVerificationToken>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Token).HasMaxLength(256).IsRequired();
            b.HasIndex(x => x.Token).IsUnique();
            b.Property(x => x.ExpiresAt).IsRequired();
            b.Property(x => x.IsUsed).HasDefaultValue(false);
            b.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

            b.HasOne(x => x.User).WithMany(x => x.EmailVerificationTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
