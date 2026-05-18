using Microsoft.EntityFrameworkCore;
using Synq.Application.DTOs;
using Synq.Infrastructure.Data;

namespace Synq.Application.Services;

/// <summary>
/// Handles proposal-related operations including creation and status updates.
/// </summary>
public class ProposalService
{
    private readonly AppDbContext _context;

    public ProposalService(AppDbContext context) => _context = context;

    /// <summary>
    /// Gets all proposals for a specific job.
    /// </summary>
    public async Task<List<ProposalDto>> GetByJobIdAsync(Guid jobId, CancellationToken ct = default) =>
        await _context.Proposals
            .Include(p => p.User)
            .Include(p => p.ProposalSkills)
            .Where(p => p.JobId == jobId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProposalDto
            {
                Id = p.Id,
                JobId = p.JobId,
                UserId = p.UserId,
                UserName = p.User.Name,
                UserAvatar = p.User.AvatarUrl,
                Price = p.Price,
                DeadlineDays = p.DeadlineDays,
                CoverLetter = p.CoverLetter,
                Status = p.Status.ToString(),
                Skills = p.ProposalSkills.Select(ps => ps.SkillName).ToList(),
                CreatedAt = p.CreatedAt
            })
            .ToListAsync(ct);

    /// <summary>
    /// Creates a new proposal for a job.
    /// </summary>
    public async Task<ProposalDto> CreateAsync(Guid jobId, Guid userId, CreateProposalRequest request, CancellationToken ct = default)
    {
        var proposal = new Domain.Entities.Proposal
        {
            Id = Guid.NewGuid(),
            JobId = jobId,
            UserId = userId,
            Price = request.Price,
            DeadlineDays = request.DeadlineDays,
            CoverLetter = request.CoverLetter,
            Status = Domain.Enums.ProposalStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            ProposalSkills = request.Skills.Select(s => new Domain.Entities.ProposalSkill { SkillName = s }).ToList()
        };

        _context.Proposals.Add(proposal);
        await _context.SaveChangesAsync(ct);

        return (await _context.Proposals
            .Include(p => p.User)
            .Include(p => p.ProposalSkills)
            .Where(p => p.Id == proposal.Id)
            .Select(p => new ProposalDto
            {
                Id = p.Id,
                JobId = p.JobId,
                UserId = p.UserId,
                UserName = p.User.Name,
                UserAvatar = p.User.AvatarUrl,
                Price = p.Price,
                DeadlineDays = p.DeadlineDays,
                CoverLetter = p.CoverLetter,
                Status = p.Status.ToString(),
                Skills = p.ProposalSkills.Select(ps => ps.SkillName).ToList(),
                CreatedAt = p.CreatedAt
            })
            .FirstAsync(ct))!;
    }

    /// <summary>
    /// Updates the status of a proposal (accept/reject). Only the job owner can do this.
    /// </summary>
    public async Task<ProposalDto> UpdateStatusAsync(Guid id, Guid clientId, string status, CancellationToken ct = default)
    {
        var proposal = await _context.Proposals
            .Include(p => p.Job)
            .Include(p => p.User)
            .Include(p => p.ProposalSkills)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new KeyNotFoundException("Proposal not found");

        if (proposal.Job.ClientId != clientId)
            throw new UnauthorizedAccessException("Only the job owner can accept/reject proposals");

        proposal.Status = Enum.Parse<Domain.Enums.ProposalStatus>(status, true);
        await _context.SaveChangesAsync(ct);

        return new ProposalDto
        {
            Id = proposal.Id,
            JobId = proposal.JobId,
            UserId = proposal.UserId,
            UserName = proposal.User.Name,
            UserAvatar = proposal.User.AvatarUrl,
            Price = proposal.Price,
            DeadlineDays = proposal.DeadlineDays,
            CoverLetter = proposal.CoverLetter,
            Status = proposal.Status.ToString(),
            Skills = proposal.ProposalSkills.Select(ps => ps.SkillName).ToList(),
            CreatedAt = proposal.CreatedAt
        };
    }

    /// <summary>
    /// Withdraws a proposal. Only the proposal owner (freelancer) can do this.
    /// </summary>
    public async Task<ProposalDto> WithdrawAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var proposal = await _context.Proposals
            .Include(p => p.Job)
            .Include(p => p.User)
            .Include(p => p.ProposalSkills)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new KeyNotFoundException("Proposal not found");

        if (proposal.UserId != userId)
            throw new UnauthorizedAccessException("Only the proposal owner can withdraw it");

        if (proposal.Status != Domain.Enums.ProposalStatus.Pending)
            throw new InvalidOperationException("Can only withdraw pending proposals");

        proposal.Status = Domain.Enums.ProposalStatus.Withdrawn;
        await _context.SaveChangesAsync(ct);

        return new ProposalDto
        {
            Id = proposal.Id,
            JobId = proposal.JobId,
            JobTitle = proposal.Job.Title,
            UserId = proposal.UserId,
            UserName = proposal.User.Name,
            UserAvatar = proposal.User.AvatarUrl,
            ClientName = proposal.Job.Client.Name,
            ClientAvatar = proposal.Job.Client.AvatarUrl,
            Price = proposal.Price,
            DeadlineDays = proposal.DeadlineDays,
            CoverLetter = proposal.CoverLetter,
            Status = proposal.Status.ToString(),
            Skills = proposal.ProposalSkills.Select(ps => ps.SkillName).ToList(),
            CreatedAt = proposal.CreatedAt
        };
    }

    /// <summary>
    /// Gets all proposals submitted by the specified freelancer.
    /// </summary>
    public async Task<List<ProposalDto>> GetMyProposalsAsync(Guid userId, CancellationToken ct = default) =>
        await _context.Proposals
            .Include(p => p.Job)
            .ThenInclude(j => j!.Category)
            .Include(p => p.Job)
            .ThenInclude(j => j!.Client)
            .Include(p => p.User)
            .Include(p => p.ProposalSkills)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProposalDto
            {
                Id = p.Id,
                JobId = p.JobId,
                JobTitle = p.Job.Title,
                UserId = p.UserId,
                UserName = p.User.Name,
                UserAvatar = p.User.AvatarUrl,
                ClientName = p.Job.Client.Name,
                ClientAvatar = p.Job.Client.AvatarUrl,
                Price = p.Price,
                DeadlineDays = p.DeadlineDays,
                CoverLetter = p.CoverLetter,
                Status = p.Status.ToString(),
                Skills = p.ProposalSkills.Select(ps => ps.SkillName).ToList(),
                CreatedAt = p.CreatedAt
            })
            .ToListAsync(ct);
}
