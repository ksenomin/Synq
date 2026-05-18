using Microsoft.AspNetCore.Mvc;

namespace Synq.WebApi.Controllers;

/// <summary>
/// Base controller providing common functionality for all API controllers.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public abstract class BaseController : ControllerBase
{
    /// <summary>
    /// Gets the current authenticated user's ID from the JWT claim.
    /// </summary>
    /// <returns>The user's GUID identifier.</returns>
    /// <exception cref="UnauthorizedAccessException">Thrown when the user is not authenticated or the claim is missing.</exception>
    protected Guid GetCurrentUserId()
    {
        var id = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(id, out var userId) ? userId : throw new UnauthorizedAccessException();
    }

    /// <summary>
    /// Returns a paginated OK response with metadata headers.
    /// </summary>
    protected IActionResult OkPaginated<T>(List<T> items, int totalCount, int page, int pageSize)
    {
        Response.Headers["X-Total-Count"] = totalCount.ToString();
        Response.Headers["X-Page"] = page.ToString();
        Response.Headers["X-Page-Size"] = pageSize.ToString();
        return Ok(new { items, totalCount, page, pageSize, totalPages = (int)Math.Ceiling(totalCount / (double)pageSize) });
    }
}
