using SecureTrace.API.Models;

namespace SecureTrace.API.Repositories.Interfaces;

public interface IEvidenceRepository
{
    Task<IEnumerable<Evidence>> GetAllAsync();
    Task<IEnumerable<Evidence>> GetByCaseIdAsync(int caseId);
    Task<Evidence?> GetByIdAsync(int id);
    Task<Evidence> CreateAsync(Evidence evidence);
    Task<Evidence?> UpdateAsync(int id, Evidence updatedEvidence);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}
