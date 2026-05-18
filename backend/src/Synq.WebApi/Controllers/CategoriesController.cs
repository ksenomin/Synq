using Microsoft.AspNetCore.Mvc;
using Synq.Application.Services;

namespace Synq.WebApi.Controllers;

/// <summary>
/// Provides category lookup endpoints.
/// </summary>
public class CategoriesController : BaseController
{
    private readonly CategoryService _service;

    public CategoriesController(CategoryService service) => _service = service;

    /// <summary>
    /// Gets all categories.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var categories = await _service.GetAllAsync(ct);
        return Ok(categories);
    }

    /// <summary>
    /// Gets a category by its slug.
    /// </summary>
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
    {
        var category = await _service.GetBySlugAsync(slug, ct);
        return category == null ? NotFound() : Ok(category);
    }
}
