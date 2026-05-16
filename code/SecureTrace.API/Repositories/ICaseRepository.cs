using SecureTrace.API.Models;

namespace SecureTrace.API.Repositories;

public interface ICaseRepository
{
    Task<IEnumerable<Case>> GetAllAsync();
    Task<Case?> GetByIdAsync(int id);
    Task<Case> CreateAsync(Case caseEntity);
    Task<Case?> UpdateAsync(int id, Case updatedCase);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}
