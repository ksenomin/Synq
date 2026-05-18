namespace Synq.Application.DTOs;

public class CreateProposalRequest
{
    public decimal Price { get; set; }
    public int DeadlineDays { get; set; }
    public string CoverLetter { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();
}
