using Microsoft.EntityFrameworkCore;
using SecureTrace.API.Data;
using SecureTrace.API.Models;
using SecureTrace.API.Repositories.Interfaces;

namespace SecureTrace.API.Repositories;

public class CaseRepository : ICaseRepository
{
    private readonly AppDbContext _db;

    public CaseRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Case>> GetAllAsync()
    {
        return await _db.Cases
            .Include(c => c.CreatedBy)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<Case?> GetByIdAsync(int id)
    {
        return await _db.Cases
            .Include(c => c.CreatedBy)
            .Include(c => c.Evidences)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Case> CreateAsync(Case caseEntity)
    {
        // Auto-generate a readable case number: CASE-2025-0001
        var year  = DateTime.UtcNow.Year;
        var count = await _db.Cases.CountAsync(c => c.CreatedAt.Year == year);
        caseEntity.CaseNumber = $"CASE-{year}-{(count + 1):D4}";

        _db.Cases.Add(caseEntity);
        await _db.SaveChangesAsync();

        // Reload with navigation properties
        return await _db.Cases
            .Include(c => c.CreatedBy)
            .FirstAsync(c => c.Id == caseEntity.Id);
    }

    public async Task<Case?> UpdateAsync(int id, Case updatedCase)
    {
        var existing = await _db.Cases.FindAsync(id);
        if (existing is null) return null;

        existing.Title       = updatedCase.Title;
        existing.Description = updatedCase.Description;
        existing.Status      = updatedCase.Status;

        // Set ClosedAt timestamp when case is closed
        if (updatedCase.Status == "Closed" && existing.ClosedAt is null)
            existing.ClosedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _db.Cases.FindAsync(id);
        if (existing is null) return false;

        _db.Cases.Remove(existing);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _db.Cases.AnyAsync(c => c.Id == id);
    }
}
