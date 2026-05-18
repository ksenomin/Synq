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
    /// Creates a new review and updates the user's average rating.
    /// </summary>
    public async Task<ReviewDto> CreateAsync(Guid authorId, CreateReviewRequest request, CancellationToken ct = default)
    {
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
            user.ReviewsCount++;
            var avgRating = await _context.Reviews
                .Where(r => r.UserId == request.UserId)
                .AverageAsync(r => r.Rating, ct);
            user.Rating = (decimal)Math.Round(avgRating, 1);
        }

        await _context.SaveChangesAsync(ct);

        var author = await _context.Users.FindAsync(new object[] { authorId }, cancellationToken: ct);
        var job = request.JobId.HasValue ? await _context.Jobs.FindAsync(new object[] { request.JobId.Value }, cancellationToken: ct) : null;

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
