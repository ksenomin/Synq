using Microsoft.EntityFrameworkCore;
using Synq.Application.DTOs;
using Synq.Infrastructure.Data;

namespace Synq.Application.Services;

/// <summary>
/// Handles job-related operations including CRUD and filtering.
/// </summary>
public class JobService
{
    private readonly AppDbContext _context;

    public JobService(AppDbContext context) => _context = context;

    /// <summary>
    /// Gets a paginated, filtered list of jobs.
    /// </summary>
    public async Task<PagedResult<JobDto>> GetFilteredAsync(JobFilterRequest filter, CancellationToken ct = default)
    {
        var query = _context.Jobs
            .Include(j => j.Category)
            .Include(j => j.Client)
            .Include(j => j.JobSkills)
            .Include(j => j.Proposals)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            if (Enum.TryParse<Domain.Enums.JobStatus>(filter.Status, true, out var parsedStatus))
                query = query.Where(j => j.Status == parsedStatus);
        }
        else
        {
            query = query.Where(j => j.Status == Domain.Enums.JobStatus.Open);
        }

        if (!string.IsNullOrWhiteSpace(filter.ClientId) && Guid.TryParse(filter.ClientId, out var clientId))
            query = query.Where(j => j.ClientId == clientId);

        if (!string.IsNullOrWhiteSpace(filter.Search))
            query = query.Where(j => j.Title.Contains(filter.Search) || j.Description.Contains(filter.Search));

        if (!string.IsNullOrWhiteSpace(filter.Category))
            query = query.Where(j => j.Category.Slug == filter.Category);

        if (filter.BudgetMin.HasValue)
            query = query.Where(j => j.BudgetMax >= filter.BudgetMin.Value);

        if (filter.BudgetMax.HasValue)
            query = query.Where(j => j.BudgetMin <= filter.BudgetMax.Value);

        query = filter.SortBy switch
        {
            "budget" => query.OrderByDescending(j => j.BudgetMax),
            "deadline" => query.OrderBy(j => j.Deadline),
            _ => query.OrderByDescending(j => j.CreatedAt)
        };

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(j => new JobDto
            {
                Id = j.Id,
                Title = j.Title,
                Description = j.Description,
                CategoryName = j.Category.Name,
                CategorySlug = j.Category.Slug,
                BudgetMin = j.BudgetMin,
                BudgetMax = j.BudgetMax,
                BudgetType = j.BudgetType.ToString(),
                Deadline = j.Deadline,
                IsUrgent = j.IsUrgent,
                Status = j.Status.ToString(),
                ClientId = j.ClientId,
                ClientName = j.Client.Name,
                ClientAvatar = j.Client.AvatarUrl,
                Skills = j.JobSkills.Select(js => js.SkillName).ToList(),
                Attachments = j.Attachments.Select(a => new JobAttachmentDto { Id = a.Id, FileName = a.FileName, FileUrl = a.FileUrl }).ToList(),
                ProposalsCount = j.Proposals.Count,
                CreatedAt = j.CreatedAt
            })
            .ToListAsync(ct);

        return new PagedResult<JobDto> { Items = items, TotalCount = total, Page = filter.Page, PageSize = filter.PageSize };
    }

    /// <summary>
    /// Gets a job by its ID with full details.
    /// </summary>
    public async Task<JobDto?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Jobs
            .Include(j => j.Category)
            .Include(j => j.Client)
            .Include(j => j.JobSkills)
            .Include(j => j.Attachments)
            .Include(j => j.Proposals)
            .Where(j => j.Id == id)
            .Select(j => new JobDto
            {
                Id = j.Id,
                Title = j.Title,
                Description = j.Description,
                CategoryName = j.Category.Name,
                CategorySlug = j.Category.Slug,
                BudgetMin = j.BudgetMin,
                BudgetMax = j.BudgetMax,
                BudgetType = j.BudgetType.ToString(),
                Deadline = j.Deadline,
                IsUrgent = j.IsUrgent,
                Status = j.Status.ToString(),
                ClientId = j.ClientId,
                ClientName = j.Client.Name,
                ClientAvatar = j.Client.AvatarUrl,
                Skills = j.JobSkills.Select(js => js.SkillName).ToList(),
                Attachments = j.Attachments.Select(a => new JobAttachmentDto { Id = a.Id, FileName = a.FileName, FileUrl = a.FileUrl }).ToList(),
                ProposalsCount = j.Proposals.Count,
                CreatedAt = j.CreatedAt
            })
            .FirstOrDefaultAsync(ct);

    /// <summary>
    /// Creates a new job posting.
    /// </summary>
    public async Task<JobDto> CreateAsync(Guid clientId, CreateJobRequest request, CancellationToken ct = default)
    {
        // Ensure all skills exist in the Skills table before creating job
        foreach (var skillName in request.Skills)
        {
            var existingSkill = await _context.Skills.FindAsync(skillName);
            if (existingSkill == null)
            {
                _context.Skills.Add(new Domain.Entities.Skill { Name = skillName });
            }
        }
        await _context.SaveChangesAsync(ct);

        var job = new Domain.Entities.Job
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            CategoryId = request.CategoryId,
            BudgetMin = request.BudgetMin,
            BudgetMax = request.BudgetMax,
            BudgetType = Enum.Parse<Domain.Enums.BudgetType>(request.BudgetType, true),
            Deadline = request.Deadline,
            IsUrgent = request.IsUrgent,
            Status = Domain.Enums.JobStatus.Open,
            ClientId = clientId,
            CreatedAt = DateTime.UtcNow,
            JobSkills = request.Skills.Select(s => new Domain.Entities.JobSkill { SkillName = s }).ToList()
        };

        _context.Jobs.Add(job);
        await _context.SaveChangesAsync(ct);

        return (await GetByIdAsync(job.Id, ct))!;
    }

    /// <summary>
    /// Updates an existing job. Only the job owner can update.
    /// </summary>
    public async Task<JobDto> UpdateAsync(Guid id, Guid clientId, UpdateJobRequest request, CancellationToken ct = default)
    {
        var job = await _context.Jobs.FindAsync(new object[] { id }, cancellationToken: ct)
            ?? throw new KeyNotFoundException("Job not found");

        if (job.ClientId != clientId)
            throw new UnauthorizedAccessException("You can only edit your own jobs");

        if (request.Title != null) job.Title = request.Title;
        if (request.Description != null) job.Description = request.Description;
        if (request.CategoryId.HasValue) job.CategoryId = request.CategoryId.Value;
        if (request.BudgetMin.HasValue) job.BudgetMin = request.BudgetMin.Value;
        if (request.BudgetMax.HasValue) job.BudgetMax = request.BudgetMax.Value;
        if (request.BudgetType != null) job.BudgetType = Enum.Parse<Domain.Enums.BudgetType>(request.BudgetType, true);
        if (request.Deadline.HasValue) job.Deadline = request.Deadline.Value;
        if (request.IsUrgent.HasValue) job.IsUrgent = request.IsUrgent.Value;

        if (request.Skills != null)
        {
            // Ensure all skills exist in the Skills table before updating job
            foreach (var skillName in request.Skills)
            {
                var existingSkill = await _context.Skills.FindAsync(skillName);
                if (existingSkill == null)
                {
                    _context.Skills.Add(new Domain.Entities.Skill { Name = skillName });
                }
            }
            await _context.SaveChangesAsync(ct);

            _context.JobSkills.RemoveRange(_context.JobSkills.Where(js => js.JobId == id));
            job.JobSkills = request.Skills.Select(s => new Domain.Entities.JobSkill { JobId = id, SkillName = s }).ToList();
        }

        await _context.SaveChangesAsync(ct);
        return (await GetByIdAsync(job.Id, ct))!;
    }

    /// <summary>
    /// Deletes a job. Only the job owner can delete.
    /// </summary>
    public async Task DeleteAsync(Guid id, Guid clientId, CancellationToken ct = default)
    {
        var job = await _context.Jobs.FindAsync(new object[] { id }, cancellationToken: ct)
            ?? throw new KeyNotFoundException("Задание не найдено");

        if (job.ClientId != clientId)
            throw new UnauthorizedAccessException("Вы можете удалять только свои задания");

        _context.Jobs.Remove(job);
        await _context.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Updates the status of a job. Only the job owner can change status.
    /// </summary>
    public async Task<JobDto> UpdateStatusAsync(Guid id, Guid clientId, string status, CancellationToken ct = default)
    {
        var job = await _context.Jobs.FindAsync(new object[] { id }, cancellationToken: ct)
            ?? throw new KeyNotFoundException("Задание не найдено");

        if (job.ClientId != clientId)
            throw new UnauthorizedAccessException("Вы можете изменять статус только своих заданий");

        job.Status = Enum.Parse<Domain.Enums.JobStatus>(status, true);
        await _context.SaveChangesAsync(ct);
        return (await GetByIdAsync(job.Id, ct))!;
    }

    /// <summary>
    /// Closes an in-progress job. Only the job owner can close.
    /// Returns the closed job and the assigned freelancer (from accepted proposal).
    /// </summary>
    public async Task<CloseJobResult> CloseJobAsync(Guid id, Guid clientId, CancellationToken ct = default)
    {
        var job = await _context.Jobs
            .Include(j => j.Proposals)
            .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(j => j.Id == id, ct)
            ?? throw new KeyNotFoundException("Задание не найдено");

        if (job.ClientId != clientId)
            throw new UnauthorizedAccessException("Вы можете завершать только свои задания");

        if (job.Status != Domain.Enums.JobStatus.InProgress)
            throw new InvalidOperationException("Завершить можно только задание со статусом «В работе»");

        var acceptedProposal = job.Proposals.FirstOrDefault(p => p.Status == Domain.Enums.ProposalStatus.Accepted);

        if (acceptedProposal != null)
        {
            var freelancer = await _context.Users.FindAsync(new object[] { acceptedProposal.UserId }, cancellationToken: ct);
            if (freelancer != null)
            {
                freelancer.CompletedJobs++;
            }
        }

        job.Status = Domain.Enums.JobStatus.Completed;
        await _context.SaveChangesAsync(ct);

        var jobDto = (await GetByIdAsync(job.Id, ct))!;

        return new CloseJobResult
        {
            Job = jobDto,
            FreelancerId = acceptedProposal?.UserId,
            FreelancerName = acceptedProposal?.User.Name
        };
    }

    /// <summary>
    /// Gets all jobs created by the specified client.
    /// </summary>
    public async Task<PagedResult<JobDto>> GetMyJobsAsync(Guid clientId, CancellationToken ct = default)
    {
        var query = _context.Jobs
            .Include(j => j.Category)
            .Include(j => j.Client)
            .Include(j => j.JobSkills)
            .Include(j => j.Proposals)
            .Where(j => j.ClientId == clientId)
            .OrderByDescending(j => j.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Select(j => new JobDto
            {
                Id = j.Id,
                Title = j.Title,
                Description = j.Description,
                CategoryName = j.Category.Name,
                CategorySlug = j.Category.Slug,
                BudgetMin = j.BudgetMin,
                BudgetMax = j.BudgetMax,
                BudgetType = j.BudgetType.ToString(),
                Deadline = j.Deadline,
                IsUrgent = j.IsUrgent,
                Status = j.Status.ToString(),
                ClientId = j.ClientId,
                ClientName = j.Client.Name,
                ClientAvatar = j.Client.AvatarUrl,
                Skills = j.JobSkills.Select(js => js.SkillName).ToList(),
                Attachments = j.Attachments.Select(a => new JobAttachmentDto { Id = a.Id, FileName = a.FileName, FileUrl = a.FileUrl }).ToList(),
                ProposalsCount = j.Proposals.Count,
                CreatedAt = j.CreatedAt
            })
            .ToListAsync(ct);

        return new PagedResult<JobDto> { Items = items, TotalCount = total, Page = 1, PageSize = total };
    }
}
