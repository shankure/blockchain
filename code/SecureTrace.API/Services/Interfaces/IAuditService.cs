using SecureTrace.API.Models;

namespace SecureTrace.API.Services.Interfaces;

public interface IAuditService
{
    /// <summary>
    /// Creates a new AuditBlock in MongoDB when evidence is created or updated.
    /// Automatically fetches the last block's hash and chains to it.
    /// </summary>
    Task AppendBlockAsync(Evidence evidence, string actionType, string actorEmail);
}
