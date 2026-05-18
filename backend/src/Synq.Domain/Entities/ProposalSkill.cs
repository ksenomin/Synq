namespace Synq.Domain.Entities;

public class ProposalSkill
{
    public Guid ProposalId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public Proposal Proposal { get; set; } = null!;
    public Skill Skill { get; set; } = null!;
}
