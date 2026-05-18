namespace Synq.Domain.Entities;

public class JobSkill
{
    public Guid JobId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public Job Job { get; set; } = null!;
    public Skill Skill { get; set; } = null!;
}
