using Synq.Domain.Enums;

namespace Synq.Domain.Entities;

public class Job
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public decimal BudgetMin { get; set; }
    public decimal BudgetMax { get; set; }
    public BudgetType BudgetType { get; set; }
    public DateTime? Deadline { get; set; }
    public bool IsUrgent { get; set; }
    public JobStatus Status { get; set; }
    public Guid ClientId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Category Category { get; set; } = null!;
    public User Client { get; set; } = null!;
    public ICollection<JobSkill> JobSkills { get; set; } = new List<JobSkill>();
    public ICollection<JobAttachment> Attachments { get; set; } = new List<JobAttachment>();
    public ICollection<Proposal> Proposals { get; set; } = new List<Proposal>();
    public ICollection<Chat> Chats { get; set; } = new List<Chat>();
}
