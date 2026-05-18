namespace Synq.Domain.Interfaces;

/// <summary>
/// Provides abstraction for file storage operations (upload, delete).
/// </summary>
public interface IFileStorage
{
    /// <summary>
    /// Saves a file stream to the specified folder and returns its accessible URL.
    /// </summary>
    Task<string> SaveAsync(string folder, string fileName, Stream fileStream, CancellationToken ct = default);

    /// <summary>
    /// Deletes a file by its URL.
    /// </summary>
    void Delete(string fileUrl);
}
