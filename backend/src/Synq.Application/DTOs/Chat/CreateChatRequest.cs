namespace Synq.Application.DTOs;

public class CreateChatRequest
{
    public Guid ParticipantId { get; set; }
    public Guid? JobId { get; set; }
}
