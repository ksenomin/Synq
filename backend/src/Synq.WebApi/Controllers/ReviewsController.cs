using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synq.Application.DTOs;
using Synq.Application.Services;

namespace Synq.WebApi.Controllers;

/// <summary>
/// Manages review creation and retrieval for users.
/// </summary>
public class ReviewsController : BaseController
{
    private readonly ReviewService _service;

    public ReviewsController(ReviewService service) => _service = service;

    /// <summary>
    /// Gets all reviews for a specific user.
    /// </summary>
    [HttpGet("user/{userId:guid}")]
    public async Task<IActionResult> GetByUserId(Guid userId, CancellationToken ct)
    {
        var reviews = await _service.GetByUserIdAsync(userId, ct);
        return Ok(reviews);
    }

    /// <summary>
    /// Gets all reviews written by the current user.
    /// </summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyReviews(CancellationToken ct)
    {
        var reviews = await _service.GetMyReviewsAsync(GetCurrentUserId(), ct);
        return Ok(reviews);
    }

    /// <summary>
    /// Creates a new review. Requires authentication.
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateReviewRequest request, CancellationToken ct)
    {
        try
        {
            var review = await _service.CreateAsync(GetCurrentUserId(), request, ct);
            return Ok(review);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
