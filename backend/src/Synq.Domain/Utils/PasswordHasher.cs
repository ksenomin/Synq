using System.Security.Cryptography;
using Konscious.Security.Cryptography;

namespace Synq.Domain.Utils;

public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int MemorySize = 65536; // 64 MB
    private const int Iterations = 3;
    private const int DegreeOfParallelism = 4;
    private const char Separator = ':';

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        using var argon2 = new Argon2id(System.Text.Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = DegreeOfParallelism,
            MemorySize = MemorySize,
            Iterations = Iterations,
            KnownSecret = null,
            AssociatedData = null
        };
        var hash = argon2.GetBytes(KeySize);

        return $"{Convert.ToHexString(salt)}{Separator}{Convert.ToHexString(hash)}";
    }

    public static bool Verify(string password, string hash)
    {
        var parts = hash.Split(Separator);
        if (parts.Length != 2) return false;

        var salt = Convert.FromHexString(parts[0]);
        var expectedHash = Convert.FromHexString(parts[1]);

        using var argon2 = new Argon2id(System.Text.Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = DegreeOfParallelism,
            MemorySize = MemorySize,
            Iterations = Iterations,
            KnownSecret = null,
            AssociatedData = null
        };
        var actualHash = argon2.GetBytes(KeySize);

        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
}
