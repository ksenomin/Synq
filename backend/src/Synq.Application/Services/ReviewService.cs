using Microsoft.EntityFrameworkCore;
using Synq.Application.DTOs;
using Synq.Infrastructure.Data;

namespace Synq.Application.Services;

/// <summary>
/// Handles review-related operations including creation and retrieval.
/// </summary>
public class ReviewService
{
    private readonly AppDbContext _context;

    public ReviewService(AppDbContext context) => _context = context;

    /// <summary>
    /// Gets all reviews for a specific user.
    /// </summary>
    public async Task<List<ReviewDto>> GetByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        await _context.Reviews
            .Include(r => r.Author)
            .Include(r => r.Job)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto
            {
                Id = r.Id,
                AuthorId = r.AuthorId,
                AuthorName = r.Author.Name,
                AuthorAvatar = r.Author.AvatarUrl,
                Rating = r.Rating,
                Text = r.Text,
                JobId = r.JobId,
                JobTitle = r.Job != null ? r.Job.Title : null,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync(ct);

    /// <summary>
    /// Gets all reviews written by the specified user.
    /// </summary>
    public async Task<List<ReviewDto>> GetMyReviewsAsync(Guid authorId, CancellationToken ct = default) =>
        await _context.Reviews
            .Include(r => r.Job)
            .Where(r => r.AuthorId == authorId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto
            {
                Id = r.Id,
                AuthorId = r.AuthorId,
                AuthorName = r.Author.Name,
                AuthorAvatar = r.Author.AvatarUrl,
                Rating = r.Rating,
                Text = r.Text,
                JobId = r.JobId,
                JobTitle = r.Job != null ? r.Job.Title : null,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync(ct);

    /// <summary>
    /// Creates a new review and updates the user's average rating.
    /// </summary>
    public async Task<ReviewDto> CreateAsync(Guid authorId, CreateReviewRequest request, CancellationToken ct = default)
    {
        Domain.Entities.Job? reviewJob = null;
        if (request.JobId.HasValue)
        {
            reviewJob = await _context.Jobs
                .Include(j => j.Proposals)
                .FirstOrDefaultAsync(j => j.Id == request.JobId.Value, ct)
                ?? throw new KeyNotFoundException("Задание не найдено");

            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.JobId == request.JobId && r.AuthorId == authorId, ct);
            if (existingReview != null)
                throw new InvalidOperationException("Вы уже оставили отзыв по этому заданию");

            if (reviewJob.Status != Domain.Enums.JobStatus.Completed)
                throw new InvalidOperationException("Отзыв можно оставить только по завершённому заданию");

            var acceptedProposal = reviewJob.Proposals.FirstOrDefault(p => p.Status == Domain.Enums.ProposalStatus.Accepted);
            var isClient = reviewJob.ClientId == authorId;
            var isFreelancer = acceptedProposal?.UserId == authorId;

            if (!isClient && !isFreelancer)
                throw new UnauthorizedAccessException("Только участники задания могут оставлять отзывы по нему");
        }

        var review = new Domain.Entities.Review
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            AuthorId = authorId,
            Rating = request.Rating,
            Text = request.Text,
            JobId = request.JobId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);

        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken: ct);
        if (user != null)
        {
            var existingRatings = await _context.Reviews
                .Where(r => r.UserId == request.UserId)
                .Select(r => (double)r.Rating)
                .ToListAsync(ct);

            existingRatings.Add(request.Rating);

            user.ReviewsCount = existingRatings.Count;
            user.Rating = (decimal)Math.Round(existingRatings.Average(), 1);
        }

        await _context.SaveChangesAsync(ct);

        var author = await _context.Users.FindAsync(new object[] { authorId }, cancellationToken: ct);
        var job = reviewJob ?? (request.JobId.HasValue ? await _context.Jobs.FindAsync(new object[] { request.JobId.Value }, cancellationToken: ct) : null);

        return new ReviewDto
        {
            Id = review.Id,
            AuthorId = authorId,
            AuthorName = author!.Name,
            AuthorAvatar = author.AvatarUrl,
            Rating = review.Rating,
            Text = review.Text,
            JobId = review.JobId,
            JobTitle = job?.Title,
            CreatedAt = review.CreatedAt
        };
    }
}
