using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Synq.Domain.Interfaces;

namespace Synq.Infrastructure.Storage;

/// <summary>
/// Local filesystem implementation of IFileStorage.
/// Stores uploaded files under the application's uploads directory.
/// </summary>
public class LocalFileStorage : IFileStorage
{
    private readonly string _basePath;
    private readonly string _urlPrefix;

    public LocalFileStorage(IWebHostEnvironment env, IConfiguration config)
    {
        _basePath = Path.Combine(env.ContentRootPath, "uploads");
        _urlPrefix = config["FileStorage:UrlPrefix"] ?? "/uploads";

        if (!Directory.Exists(_basePath))
            Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveAsync(string folder, string fileName, Stream fileStream, CancellationToken ct = default)
    {
        var folderPath = Path.Combine(_basePath, folder);
        if (!Directory.Exists(folderPath))
            Directory.CreateDirectory(folderPath);

        var safeFileName = $"{Guid.NewGuid():N}{Path.GetExtension(fileName)}";
        var filePath = Path.Combine(folderPath, safeFileName);

        await using var stream = File.Create(filePath);
        await fileStream.CopyToAsync(stream, ct);

        return $"{_urlPrefix}/{folder}/{safeFileName}";
    }

    public void Delete(string fileUrl)
    {
        if (string.IsNullOrEmpty(fileUrl)) return;

        var relativePath = fileUrl.Replace(_urlPrefix, "").TrimStart('/');
        var fullPath = Path.Combine(_basePath, relativePath);

        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }
}
