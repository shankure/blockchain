using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SecureTrace.API.Data;
using SecureTrace.API.Models;
using SecureTrace.API.Repositories;
using Xunit;

namespace SecureTrace.Tests;

/// <summary>
/// Tests for CaseRepository — covers the repository layer.
/// Uses EF Core InMemory database so no real PostgreSQL needed.
/// </summary>
public class CaseRepositoryTests
{
    private AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private async Task<int> SeedUserAsync(AppDbContext db)
    {
        var user = new User
        {
            FullName     = "Test Admin",
            Email        = "admin@test.com",
            PasswordHash = "hashed",
            Role         = "Admin"
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user.Id;
    }

    // ── CreateAsync tests ─────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_ValidCase_AutoGeneratesCaseNumber()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var userId   = await SeedUserAsync(db);
        var repo     = new CaseRepository(db);

        var caseEntity = new Case
        {
            Title           = "Test Case",
            Description     = "A forensic case",
            Status          = "Open",
            CreatedByUserId = userId
        };

        // Act
        var created = await repo.CreateAsync(caseEntity);

        // Assert — case number should follow the CASE-YYYY-NNNN format
        created.CaseNumber.Should().StartWith("CASE-");
        created.CaseNumber.Should().MatchRegex(@"^CASE-\d{4}-\d{4}$");
    }

    [Fact]
    public async Task CreateAsync_MultipleCases_CaseNumbersAreSequential()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var userId   = await SeedUserAsync(db);
        var repo     = new CaseRepository(db);

        // Act
        var case1 = await repo.CreateAsync(new Case { Title = "Case 1", Description = "Desc", Status = "Open", CreatedByUserId = userId });
        var case2 = await repo.CreateAsync(new Case { Title = "Case 2", Description = "Desc", Status = "Open", CreatedByUserId = userId });

        // Assert
        case1.CaseNumber.Should().EndWith("0001");
        case2.CaseNumber.Should().EndWith("0002");
    }

    // ── GetByIdAsync tests ────────────────────────────────────────────────────

    [Fact]
    public async Task GetByIdAsync_ExistingCase_ReturnsCase()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var userId   = await SeedUserAsync(db);
        var repo     = new CaseRepository(db);
        var created  = await repo.CreateAsync(new Case { Title = "Evidence Case", Description = "Desc", Status = "Open", CreatedByUserId = userId });

        // Act
        var result = await repo.GetByIdAsync(created.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Title.Should().Be("Evidence Case");
    }

    [Fact]
    public async Task GetByIdAsync_NonExistentId_ReturnsNull()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var repo     = new CaseRepository(db);

        // Act
        var result = await repo.GetByIdAsync(999);

        // Assert
        result.Should().BeNull();
    }

    // ── UpdateAsync tests ─────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAsync_ExistingCase_UpdatesFields()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var userId   = await SeedUserAsync(db);
        var repo     = new CaseRepository(db);
        var created  = await repo.CreateAsync(new Case { Title = "Old Title", Description = "Old Desc", Status = "Open", CreatedByUserId = userId });

        // Act
        var updated = await repo.UpdateAsync(created.Id, new Case
        {
            Title       = "New Title",
            Description = "New Desc",
            Status      = "Closed"
        });

        // Assert
        updated.Should().NotBeNull();
        updated!.Title.Should().Be("New Title");
        updated.Status.Should().Be("Closed");
        updated.ClosedAt.Should().NotBeNull(); // ClosedAt should be set when status = Closed
    }

    [Fact]
    public async Task UpdateAsync_NonExistentCase_ReturnsNull()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var repo     = new CaseRepository(db);

        // Act
        var result = await repo.UpdateAsync(999, new Case { Title = "X", Description = "X", Status = "Open" });

        // Assert
        result.Should().BeNull();
    }

    // ── DeleteAsync tests ─────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAsync_ExistingCase_ReturnsTrueAndRemovesCase()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var userId   = await SeedUserAsync(db);
        var repo     = new CaseRepository(db);
        var created  = await repo.CreateAsync(new Case { Title = "To Delete", Description = "Desc", Status = "Open", CreatedByUserId = userId });

        // Act
        var deleted = await repo.DeleteAsync(created.Id);
        var found   = await repo.GetByIdAsync(created.Id);

        // Assert
        deleted.Should().BeTrue();
        found.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_NonExistentCase_ReturnsFalse()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var repo     = new CaseRepository(db);

        // Act
        var result = await repo.DeleteAsync(999);

        // Assert
        result.Should().BeFalse();
    }
}
