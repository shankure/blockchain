using SecureTrace.API.DTOs;

namespace SecureTrace.API.Services;

public interface IVerificationService
{
    /// <summary>
    /// Reads the entire MongoDB audit chain sequentially,
    /// re-computes every hash, and verifies the chain is unbroken.
    /// </summary>
    Task<VerificationResult> VerifyChainAsync();
}
