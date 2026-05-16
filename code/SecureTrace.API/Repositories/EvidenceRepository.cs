using Microsoft.EntityFrameworkCore;
using SecureTrace.API.Data;
using SecureTrace.API.Models;

namespace SecureTrace.API.Repositories;

public class EvidenceRepository : IEvidenceRepository
{
    private readonly AppDbContext _db;

    public EvidenceRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Evidence>> GetAllAsync()
    {
        return await _db.Evidences
            .Include(e => e.Case)
            .Include(e => e.UploadedBy)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Evidence>> GetByCaseIdAsync(int caseId)
    {
        return await _db.Evidences
            .Include(e => e.Case)
            .Include(e => e.UploadedBy)
            .Where(e => e.CaseId == caseId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<Evidence?> GetByIdAsync(int id)
    {
        return await _db.Evidences
            .Include(e => e.Case)
            .Include(e => e.UploadedBy)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Evidence> CreateAsync(Evidence evidence)
    {
        evidence.CreatedAt = DateTime.UtcNow;
        _db.Evidences.Add(evidence);
        await _db.SaveChangesAsync();

        // Reload with navigation properties so the response has CaseNumber and UploadedBy
        return await _db.Evidences
            .Include(e => e.Case)
            .Include(e => e.UploadedBy)
            .FirstAsync(e => e.Id == evidence.Id);
    }

    public async Task<Evidence?> UpdateAsync(int id, Evidence updatedEvidence)
    {
        var existing = await _db.Evidences.FindAsync(id);
        if (existing is null) return null;

        existing.Title         = updatedEvidence.Title;
        existing.Description   = updatedEvidence.Description;
        existing.EvidenceType  = updatedEvidence.EvidenceType;
        existing.FileReference = updatedEvidence.FileReference;
        existing.CollectedAt   = updatedEvidence.CollectedAt;
        existing.UpdatedAt     = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _db.Evidences.FindAsync(id);
        if (existing is null) return false;

        _db.Evidences.Remove(existing);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _db.Evidences.AnyAsync(e => e.Id == id);
    }
}
