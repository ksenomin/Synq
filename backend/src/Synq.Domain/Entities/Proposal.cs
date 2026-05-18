using Synq.Domain.Enums;

namespace Synq.Domain.Entities;

public class Proposal
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public Guid UserId { get; set; }
    public decimal Price { get; set; }
    public int DeadlineDays { get; set; }
    public string CoverLetter { get; set; } = string.Empty;
    public ProposalStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }

    public Job Job { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<ProposalSkill> ProposalSkills { get; set; } = new List<ProposalSkill>();
}
