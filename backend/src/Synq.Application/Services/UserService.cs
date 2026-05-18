using Microsoft.EntityFrameworkCore;
using Synq.Application.DTOs;
using Synq.Infrastructure.Data;

namespace Synq.Application.Services;

/// <summary>
/// Handles user-related operations including retrieval and profile updates.
/// </summary>
public class UserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context) => _context = context;

    /// <summary>
    /// Gets a user by their ID.
    /// </summary>
    public async Task<UserDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        return user == null ? null : MapToDto(user);
    }

    /// <summary>
    /// Gets a user by their name slug (transliterated).
    /// </summary>
    public async Task<UserDto?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var users = await _context.Users.ToListAsync(ct);
        foreach (var user in users)
        {
            if (ToSlug(user.Name) == slug)
                return MapToDto(user);
        }
        return null;
    }

    private static string ToSlug(string name)
    {
        var translit = new Dictionary<char, string>
        {
            {'а',"a"},{'б',"b"},{'в',"v"},{'г',"g"},{'д',"d"},{'е',"e"},{'ё',"yo"},{'ж',"zh"},
            {'з',"z"},{'и',"i"},{'й',"y"},{'к',"k"},{'л',"l"},{'м',"m"},{'н',"n"},{'о',"o"},
            {'п',"p"},{'р',"r"},{'с',"s"},{'т',"t"},{'у',"u"},{'ф',"f"},{'х',"kh"},{'ц',"ts"},
            {'ч',"ch"},{'ш',"sh"},{'щ',"shch"},{'ъ',""},{'ы',"y"},{'ь',""},{'э',"e"},{'ю',"yu"},{'я',"ya"},
        };
        var lower = name.ToLowerInvariant();
        var sb = new System.Text.StringBuilder();
        foreach (var c in lower)
        {
            if (translit.TryGetValue(c, out var replacement))
                sb.Append(replacement);
            else if (char.IsLetterOrDigit(c))
                sb.Append(c);
            else
                sb.Append('-');
        }
        var result = sb.ToString();
        while (result.Contains("--"))
            result = result.Replace("--", "-");
        return result.Trim('-');
    }

    /// <summary>
    /// Gets a user by their email address.
    /// </summary>
    public async Task<UserDto?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        return user == null ? null : MapToDto(user);
    }

    /// <summary>
    /// Gets a user by ID with additional details.
    /// </summary>
    public async Task<UserDto?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        return user == null ? null : MapToDto(user);
    }

    /// <summary>
    /// Gets a paginated list of freelancers sorted by rating.
    /// </summary>
    public async Task<PagedResult<UserDto>> GetFreelancersAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.Users.Where(u => u.Role == Domain.Enums.UserRole.Freelancer);
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(u => u.Rating)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => MapToDto(u))
            .ToListAsync(ct);

        return new PagedResult<UserDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    /// <summary>
    /// Updates user profile information.
    /// </summary>
    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken ct = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken: ct)
            ?? throw new KeyNotFoundException("User not found");

        if (request.Name != null) user.Name = request.Name;
        if (request.Bio != null) user.Bio = request.Bio;
        if (request.Location != null) user.Location = request.Location;
        if (request.YearsOfExperience.HasValue) user.YearsOfExperience = request.YearsOfExperience;
        if (request.HourlyRate.HasValue) user.HourlyRate = request.HourlyRate;
        if (request.PortfolioUrl != null) user.PortfolioUrl = request.PortfolioUrl;

        await _context.SaveChangesAsync(ct);
        return MapToDto(user);
    }

    /// <summary>
    /// Sets the user's avatar URL.
    /// </summary>
    public async Task<UserDto> SetAvatarAsync(Guid id, string avatarUrl, CancellationToken ct = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken: ct)
            ?? throw new KeyNotFoundException("User not found");

        user.AvatarUrl = avatarUrl;
        await _context.SaveChangesAsync(ct);
        return MapToDto(user);
    }

    /// <summary>
    /// Sets the user's cover image URL.
    /// </summary>
    public async Task<UserDto> SetCoverAsync(Guid id, string coverUrl, CancellationToken ct = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken: ct)
            ?? throw new KeyNotFoundException("User not found");

        user.CoverUrl = coverUrl;
        await _context.SaveChangesAsync(ct);
        return MapToDto(user);
    }

    private static UserDto MapToDto(Domain.Entities.User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Name = user.Name,
        Role = user.Role.ToString(),
        AvatarUrl = user.AvatarUrl,
        CoverUrl = user.CoverUrl,
        Bio = user.Bio,
        Location = user.Location,
        YearsOfExperience = user.YearsOfExperience,
        IsVerified = user.IsVerified,
        Rating = user.Rating,
        ReviewsCount = user.ReviewsCount,
        CompletedJobs = user.CompletedJobs,
        HourlyRate = user.HourlyRate,
        PortfolioUrl = user.PortfolioUrl,
        PortfolioFileUrl = user.PortfolioFileUrl,
        CreatedAt = user.CreatedAt
    };
}
