using Microsoft.EntityFrameworkCore;
using Synq.Application.DTOs;
using Synq.Infrastructure.Data;

namespace Synq.Application.Services;

/// <summary>
/// Handles post-related operations including CRUD and likes.
/// </summary>
public class PostService
{
    private readonly AppDbContext _context;

    public PostService(AppDbContext context) => _context = context;

    /// <summary>
    /// Gets paginated posts for a specific user.
    /// </summary>
    public async Task<PagedResult<PostDto>> GetByUserIdAsync(Guid userId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.Posts
            .Include(p => p.User)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<PostDto>
        {
            Items = items.Select(p => MapToDto(p)).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <summary>
    /// Creates a new post.
    /// </summary>
    public async Task<PostDto> CreateAsync(Guid userId, CreatePostRequest request, CancellationToken ct = default)
    {
        var post = new Domain.Entities.Post
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = request.Title,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow
        };

        _context.Posts.Add(post);
        await _context.SaveChangesAsync(ct);

        var loaded = await _context.Posts
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == post.Id, ct);

        return MapToDto(loaded!);
    }

    /// <summary>
    /// Updates an existing post. Only the post author can update.
    /// </summary>
    public async Task<PostDto> UpdateAsync(Guid id, Guid userId, CreatePostRequest request, CancellationToken ct = default)
    {
        var post = await _context.Posts.FindAsync(new object[] { id }, cancellationToken: ct)
            ?? throw new KeyNotFoundException("Post not found");

        if (post.UserId != userId)
            throw new UnauthorizedAccessException("You can only edit your own posts");

        post.Title = request.Title;
        post.Content = request.Content;
        await _context.SaveChangesAsync(ct);

        var loaded = await _context.Posts
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == post.Id, ct);

        return MapToDto(loaded!);
    }

    /// <summary>
    /// Deletes a post. Only the post author can delete.
    /// </summary>
    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var post = await _context.Posts.FindAsync(new object[] { id }, cancellationToken: ct)
            ?? throw new KeyNotFoundException("Post not found");

        if (post.UserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own posts");

        _context.Posts.Remove(post);
        await _context.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Increments like count on a post.
    /// </summary>
    public async Task LikeAsync(Guid postId, CancellationToken ct = default)
    {
        var post = await _context.Posts.FindAsync(new object[] { postId }, cancellationToken: ct)
            ?? throw new KeyNotFoundException("Post not found");

        post.LikesCount++;
        await _context.SaveChangesAsync(ct);
    }

    private static PostDto MapToDto(Domain.Entities.Post post) => new()
    {
        Id = post.Id,
        UserId = post.UserId,
        AuthorName = post.User.Name,
        AuthorAvatar = post.User.AvatarUrl,
        Title = post.Title,
        Content = post.Content,
        LikesCount = post.LikesCount,
        CommentsCount = post.CommentsCount,
        CreatedAt = post.CreatedAt
    };
}
