using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synq.Application.DTOs;
using Synq.Application.Services;

namespace Synq.WebApi.Controllers;

/// <summary>
/// Manages job proposal submission and status updates.
/// </summary>
public class ProposalsController : BaseController
{
    private readonly ProposalService _service;

    public ProposalsController(ProposalService service) => _service = service;

    /// <summary>
    /// Gets all proposals for a specific job.
    /// </summary>
    [HttpGet("job/{jobId:guid}")]
    public async Task<IActionResult> GetByJobId(Guid jobId, CancellationToken ct)
    {
        var proposals = await _service.GetByJobIdAsync(jobId, ct);
        return Ok(proposals);
    }

    /// <summary>
    /// Submits a proposal for a job. Requires authentication.
    /// </summary>
    [HttpPost("job/{jobId:guid}")]
    [Authorize]
    public async Task<IActionResult> Create(Guid jobId, [FromBody] CreateProposalRequest request, CancellationToken ct)
    {
        var proposal = await _service.CreateAsync(jobId, GetCurrentUserId(), request, ct);
        return Ok(proposal);
    }

    /// <summary>
    /// Updates the status of a proposal. Only the job owner can change status.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateProposalStatusRequest request, CancellationToken ct)
    {
        try
        {
            var proposal = await _service.UpdateStatusAsync(id, GetCurrentUserId(), request.Status, ct);
            return Ok(proposal);
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
    /// Gets all proposals submitted by the current authenticated user (freelancer).
    /// </summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyProposals(CancellationToken ct)
    {
        var proposals = await _service.GetMyProposalsAsync(GetCurrentUserId(), ct);
        return Ok(new { items = proposals, totalCount = proposals.Count, page = 1, pageSize = proposals.Count });
    }

    /// <summary>
    /// Withdraws the current user's proposal. Only the proposal owner can withdraw.
    /// </summary>
    [HttpPost("{id:guid}/withdraw")]
    [Authorize]
    public async Task<IActionResult> Withdraw(Guid id, CancellationToken ct)
    {
        try
        {
            var proposal = await _service.WithdrawAsync(id, GetCurrentUserId(), ct);
            return Ok(proposal);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException ex)
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
/// Request DTO for updating a proposal's status.
/// </summary>
public class UpdateProposalStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
