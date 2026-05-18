using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synq.Application.DTOs;
using Synq.Application.Services;
using Synq.Domain.Interfaces;

namespace Synq.WebApi.Controllers;

/// <summary>
/// Manages user profile operations including retrieval, updates, and file uploads.
/// </summary>
public class UsersController : BaseController
{
    private readonly UserService _userService;
    private readonly IFileStorage _fileStorage;

    public UsersController(UserService userService, IFileStorage fileStorage)
    {
        _userService = userService;
        _fileStorage = fileStorage;
    }

    /// <summary>
    /// Gets the currently authenticated user's profile.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var user = await _userService.GetByIdAsync(GetCurrentUserId(), ct);
        return user == null ? NotFound() : Ok(user);
    }

    /// <summary>
    /// Gets a user profile by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var user = await _userService.GetByIdAsync(id, ct);
        return user == null ? NotFound() : Ok(user);
    }

    /// <summary>
    /// Gets a user profile by name slug (e.g. /api/users/slug/aleksey-petrov).
    /// </summary>
    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
    {
        var result = await _userService.GetBySlugAsync(slug, ct);
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Updates the current user's profile.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        if (id != GetCurrentUserId())
            return Forbid();

        try
        {
            var user = await _userService.UpdateAsync(id, request, ct);
            return Ok(user);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Uploads an avatar image for the current user.
    /// </summary>
    [HttpPost("{id:guid}/avatar")]
    [Authorize]
    public async Task<IActionResult> UploadAvatar(Guid id, IFormFile file, CancellationToken ct)
    {
        if (id != GetCurrentUserId())
            return Forbid();

        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        await using var stream = file.OpenReadStream();
        var url = await _fileStorage.SaveAsync("avatars", fileName, stream, ct);
        var user = await _userService.SetAvatarAsync(id, url, ct);
        return Ok(user);
    }

    /// <summary>
    /// Uploads a cover image for the current user.
    /// </summary>
    [HttpPost("{id:guid}/cover")]
    [Authorize]
    public async Task<IActionResult> UploadCover(Guid id, IFormFile file, CancellationToken ct)
    {
        if (id != GetCurrentUserId())
            return Forbid();

        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        await using var stream = file.OpenReadStream();
        var url = await _fileStorage.SaveAsync("covers", fileName, stream, ct);
        var user = await _userService.SetCoverAsync(id, url, ct);
        return Ok(user);
    }

    /// <summary>
    /// Gets a paginated list of freelancers.
    /// </summary>
    [HttpGet("freelancers")]
    public async Task<IActionResult> GetFreelancers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await _userService.GetFreelancersAsync(page, pageSize, ct);
        return OkPaginated(result.Items, result.TotalCount, result.Page, result.PageSize);
    }
}
