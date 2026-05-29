namespace Synq.Application.DTOs;

public class CloseJobResult
{
    public JobDto Job { get; set; } = null!;
    public Guid? FreelancerId { get; set; }
    public string? FreelancerName { get; set; }
}
