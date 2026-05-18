using Microsoft.EntityFrameworkCore;
using Synq.Application.DTOs;
using Synq.Infrastructure.Data;

namespace Synq.Application.Services;

/// <summary>
/// Handles category-related operations.
/// </summary>
public class CategoryService
{
    private readonly AppDbContext _context;

    public CategoryService(AppDbContext context) => _context = context;

    /// <summary>
    /// Gets all categories.
    /// </summary>
    public async Task<List<CategoryDto>> GetAllAsync(CancellationToken ct = default) =>
        await _context.Categories
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Icon = c.Icon,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                Color = c.Color,
                JobCount = c.Jobs.Count
            })
            .ToListAsync(ct);

    /// <summary>
    /// Gets a category by its slug.
    /// </summary>
    public async Task<CategoryDto?> GetBySlugAsync(string slug, CancellationToken ct = default) =>
        await _context.Categories
            .Where(c => c.Slug == slug)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Icon = c.Icon,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                Color = c.Color,
                JobCount = c.Jobs.Count
            })
            .FirstOrDefaultAsync(ct);
}
