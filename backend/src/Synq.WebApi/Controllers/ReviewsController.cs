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
    /// Creates a new review. Requires authentication.
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateReviewRequest request, CancellationToken ct)
    {
        var review = await _service.CreateAsync(GetCurrentUserId(), request, ct);
        return Ok(review);
    }
}
