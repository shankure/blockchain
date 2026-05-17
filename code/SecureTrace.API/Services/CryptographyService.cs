using SecureTrace.API.Services.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace SecureTrace.API.Services;

public class CryptographyService : ICryptographyService
{
    public string ComputeHash(string input)
    {
        // SHA256.HashData is the modern .NET way — no need to manually
        // create/dispose the SHA256 object
        var inputBytes  = Encoding.UTF8.GetBytes(input);
        var hashBytes   = SHA256.HashData(inputBytes);

        // Convert the raw bytes to a readable hex string
        // e.g. [0x3a, 0xf2, ...] → "3af2..."
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    public string BuildBlockPayload(
    int blockIndex,
    DateTime timestamp,
    int evidenceId,
    string actionType,
    string evidenceSnapshot,
    string actorEmail,
    string previousHash)
    {
        // We concatenate all fields with a pipe separator.
        // The separator prevents ambiguity — without it,
        // blockIndex=1, evidenceId=23 would hash the same as
        // blockIndex=12, evidenceId=3 since "123" == "123"
        //
        // IMPORTANT: This exact format must be used in the
        // verification engine too, otherwise re-computed hashes
        // will not match the stored ones.

        // Normalize to milliseconds to avoid precision differences
        // between how DateTime is stored vs retrieved from MongoDB
        var normalizedTimestamp = new DateTime(
            timestamp.Ticks / TimeSpan.TicksPerMillisecond * TimeSpan.TicksPerMillisecond,
            DateTimeKind.Utc
        );

        return $"{blockIndex}|{normalizedTimestamp:O}|{evidenceId}|{actionType}|{evidenceSnapshot}|{actorEmail}|{previousHash}";
    }
}