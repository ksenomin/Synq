namespace Synq.Domain.Entities;

public class Skill
{
    public string Name { get; set; } = string.Empty;
    public ICollection<JobSkill> JobSkills { get; set; } = new List<JobSkill>();
    public ICollection<ProposalSkill> ProposalSkills { get; set; } = new List<ProposalSkill>();
}
