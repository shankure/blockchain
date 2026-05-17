using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using SecureTrace.API.Data;
using SecureTrace.API.DTOs;
using SecureTrace.API.Services;
using Xunit;

namespace SecureTrace.Tests;

/// <summary>
/// Tests for AuthService — covers registration and login business logic.
/// Uses an in-memory EF Core database so no real PostgreSQL needed.
/// </summary>
public class AuthServiceTests
{
    private AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // fresh DB per test
            .Options;
        return new AppDbContext(options);
    }

    private IConfiguration CreateConfig()
    {
        var settings = new Dictionary<string, string?>
        {
            ["Jwt:Key"]              = "SecureTrace2025XyZSuperSecretKey9999",
            ["Jwt:Issuer"]           = "SecureTrace.API",
            ["Jwt:Audience"]         = "SecureTrace.Client",
            ["Jwt:ExpiresInMinutes"] = "60"
        };
        return new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
    }

    private AuthService CreateService(AppDbContext db)
    {
        var config  = CreateConfig();
        var jwt     = new JwtService(config);
        return new AuthService(db, jwt, config);
    }

    // ── Register tests ────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_ValidRequest_ReturnsTokenAndCorrectRole()
    {
        // Arrange
        using var db      = CreateInMemoryDb();
        var service       = CreateService(db);
        var request       = new RegisterRequest("Test Admin", "admin@test.com", "Password123!", "Admin");

        // Act
        var result = await service.RegisterAsync(request);

        // Assert
        result.Token.Should().NotBeNullOrEmpty();
        result.Role.Should().Be("Admin");
        result.Email.Should().Be("admin@test.com");
    }

    [Fact]
    public async Task Register_DuplicateEmail_ThrowsInvalidOperationException()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var service  = CreateService(db);
        var request  = new RegisterRequest("User One", "same@test.com", "Password123!", "User");

        await service.RegisterAsync(request); // first registration succeeds

        // Act
        var act = async () => await service.RegisterAsync(request); // second should fail

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already registered*");
    }

    [Fact]
    public async Task Register_InvalidRole_ThrowsArgumentException()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var service  = CreateService(db);
        var request  = new RegisterRequest("Hacker", "hack@test.com", "Password123!", "SuperAdmin");

        // Act
        var act = async () => await service.RegisterAsync(request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Invalid role*");
    }

    // ── Login tests ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_CorrectCredentials_ReturnsToken()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var service  = CreateService(db);
        await service.RegisterAsync(new RegisterRequest("Agent", "agent@test.com", "Password123!", "User"));

        // Act
        var result = await service.LoginAsync(new LoginRequest("agent@test.com", "Password123!"));

        // Assert
        result.Token.Should().NotBeNullOrEmpty();
        result.Role.Should().Be("User");
    }

    [Fact]
    public async Task Login_WrongPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var service  = CreateService(db);
        await service.RegisterAsync(new RegisterRequest("Agent", "agent@test.com", "Password123!", "User"));

        // Act
        var act = async () => await service.LoginAsync(new LoginRequest("agent@test.com", "WrongPassword!"));

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Invalid email or password*");
    }

    [Fact]
    public async Task Login_NonExistentEmail_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var service  = CreateService(db);

        // Act — no user registered at all
        var act = async () => await service.LoginAsync(new LoginRequest("nobody@test.com", "Password123!"));

        // Assert — same error message as wrong password (prevents user enumeration)
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Invalid email or password*");
    }
}
