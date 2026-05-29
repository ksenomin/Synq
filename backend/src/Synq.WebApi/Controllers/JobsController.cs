using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synq.Application.DTOs;
using Synq.Application.Services;

namespace Synq.WebApi.Controllers;

/// <summary>
/// Manages job posting CRUD operations.
/// </summary>
public class JobsController : BaseController
{
    private readonly JobService _service;

    public JobsController(JobService service) => _service = service;

    /// <summary>
    /// Gets a paginated, filtered list of jobs.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] JobFilterRequest filter, CancellationToken ct)
    {
        var result = await _service.GetFilteredAsync(filter, ct);
        return OkPaginated(result.Items, result.TotalCount, result.Page, result.PageSize);
    }

    /// <summary>
    /// Gets a single job by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var job = await _service.GetByIdAsync(id, ct);
        return job == null ? NotFound() : Ok(job);
    }

    /// <summary>
    /// Creates a new job posting. Requires authentication.
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateJobRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        var job = await _service.CreateAsync(GetCurrentUserId(), request, ct);
        return CreatedAtAction(nameof(GetById), new { id = job.Id }, job);
    }

    /// <summary>
    /// Updates an existing job posting. Only the owner can update.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateJobRequest request, CancellationToken ct)
    {
        try
        {
            var job = await _service.UpdateAsync(id, GetCurrentUserId(), request, ct);
            return Ok(job);
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
    /// Deletes a job posting. Only the owner can delete.
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
    /// Updates the status of a job posting. Only the owner can change status.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request, CancellationToken ct)
    {
        try
        {
            var job = await _service.UpdateStatusAsync(id, GetCurrentUserId(), request.Status, ct);
            return Ok(job);
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
    /// Gets all jobs created by the current authenticated user.
    /// </summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyJobs(CancellationToken ct)
    {
        var result = await _service.GetMyJobsAsync(GetCurrentUserId(), ct);
        return OkPaginated(result.Items, result.TotalCount, result.Page, result.PageSize);
    }

    /// <summary>
    /// Closes an in-progress job. Only the job owner can close.
    /// </summary>
    [HttpPost("{id:guid}/close")]
    [Authorize]
    public async Task<IActionResult> CloseJob(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await _service.CloseJobAsync(id, GetCurrentUserId(), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
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

/// <summary>
/// Request DTO for updating a job's status.
/// </summary>
public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
