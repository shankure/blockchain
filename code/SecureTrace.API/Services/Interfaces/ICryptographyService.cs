namespace SecureTrace.API.Services.Interfaces;

public interface ICryptographyService
{
    /// <summary>
    /// Computes a SHA-256 hash of the given input string.
    /// Returns a lowercase hex string (64 characters).
    /// </summary>
    string ComputeHash(string input);

    /// <summary>
    /// Builds the raw string that gets hashed for a block.
    /// Having this as a separate method is critical — the verification
    /// engine must reconstruct the exact same string to re-verify hashes.
    /// </summary>
    string BuildBlockPayload(
        int blockIndex,
        DateTime timestamp,
        int evidenceId,
        string actionType,
        string evidenceSnapshot,
        string actorEmail,
        string previousHash
    );
}
