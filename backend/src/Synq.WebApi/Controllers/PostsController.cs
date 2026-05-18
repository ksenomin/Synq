using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synq.Application.DTOs;
using Synq.Application.Services;

namespace Synq.WebApi.Controllers;

/// <summary>
/// Manages social post creation, updates, and interactions.
/// </summary>
public class PostsController : BaseController
{
    private readonly PostService _service;

    public PostsController(PostService service) => _service = service;

    /// <summary>
    /// Gets paginated posts for a specific user.
    /// </summary>
    [HttpGet("user/{userId:guid}")]
    public async Task<IActionResult> GetByUserId(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await _service.GetByUserIdAsync(userId, page, pageSize, ct);
        return OkPaginated(result.Items, result.TotalCount, result.Page, result.PageSize);
    }

    /// <summary>
    /// Creates a new post. Requires authentication.
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreatePostRequest request, CancellationToken ct)
    {
        var post = await _service.CreateAsync(GetCurrentUserId(), request, ct);
        return Ok(post);
    }

    /// <summary>
    /// Updates an existing post. Only the author can update.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreatePostRequest request, CancellationToken ct)
    {
        try
        {
            var post = await _service.UpdateAsync(id, GetCurrentUserId(), request, ct);
            return Ok(post);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Deletes a post. Only the author can delete.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await _service.DeleteAsync(id, GetCurrentUserId(), ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Likes a post. Requires authentication.
    /// </summary>
    [HttpPost("{id:guid}/like")]
    [Authorize]
    public async Task<IActionResult> Like(Guid id, CancellationToken ct)
    {
        try
        {
            await _service.LikeAsync(id, ct);
            return Ok(new { message = "Liked" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
