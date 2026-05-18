namespace Synq.Domain.Entities;

public class JobAttachment
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public Job Job { get; set; } = null!;
}
