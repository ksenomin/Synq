using System.Security.Cryptography;

namespace Synq.Domain.Utils;

public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100_000;
    private const char Separator = ':';

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(KeySize);

        return $"{Convert.ToHexString(salt)}{Separator}{Convert.ToHexString(hash)}{Separator}{Iterations}";
    }

    public static bool Verify(string password, string hash)
    {
        var parts = hash.Split(Separator);
        if (parts.Length != 3) return false;

        var salt = Convert.FromHexString(parts[0]);
        var expectedHash = Convert.FromHexString(parts[1]);
        if (!int.TryParse(parts[2], out var iterations)) return false;

        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256);
        var actualHash = pbkdf2.GetBytes(KeySize);

        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
}
