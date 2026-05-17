using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SecureTrace.API.Controllers;
using SecureTrace.API.DTOs;
using SecureTrace.API.Models;
using SecureTrace.API.Repositories;
using SecureTrace.API.Repositories.Interfaces;
using System.Security.Claims;
using Xunit;

namespace SecureTrace.Tests;

/// <summary>
/// Tests for CasesController — covers the controller layer.
/// Mocks ICaseRepository so no database is needed.
/// </summary>
public class CasesControllerTests
{
    private CasesController CreateController(Mock<ICaseRepository> mockRepo)
    {
        var controller = new CasesController(mockRepo.Object);

        // Simulate an authenticated Admin user in the HTTP context
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Email,          "admin@test.com"),
            new Claim(ClaimTypes.Role,           "Admin"),
            new Claim(ClaimTypes.Name,           "Test Admin")
        };
        var identity  = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        return controller;
    }

    // ── GetAll tests ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ReturnsOkWithAllCases()
    {
        // Arrange
        var mockRepo = new Mock<ICaseRepository>();
        mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Case>
        {
            new() { Id = 1, CaseNumber = "CASE-2026-0001", Title = "Case A", Description = "Desc", Status = "Open", CreatedBy = new User { FullName = "Admin" } },
            new() { Id = 2, CaseNumber = "CASE-2026-0002", Title = "Case B", Description = "Desc", Status = "Open", CreatedBy = new User { FullName = "Admin" } }
        });

        var controller = CreateController(mockRepo);

        // Act
        var result = await controller.GetAll();

        // Assert
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var cases = ok.Value.Should().BeAssignableTo<IEnumerable<CaseResponse>>().Subject;
        cases.Should().HaveCount(2);
    }

    // ── GetById tests ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ExistingCase_ReturnsOk()
    {
        // Arrange
        var mockRepo = new Mock<ICaseRepository>();
        mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(
            new Case { Id = 1, CaseNumber = "CASE-2026-0001", Title = "Case A", Description = "Desc", Status = "Open", CreatedBy = new User { FullName = "Admin" } }
        );

        var controller = CreateController(mockRepo);

        // Act
        var result = await controller.GetById(1);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetById_NonExistentCase_ReturnsNotFound()
    {
        // Arrange
        var mockRepo = new Mock<ICaseRepository>();
        mockRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Case?)null);

        var controller = CreateController(mockRepo);

        // Act
        var result = await controller.GetById(999);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ── Create tests ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ValidRequest_ReturnsCreated()
    {
        // Arrange
        var mockRepo = new Mock<ICaseRepository>();
        mockRepo.Setup(r => r.CreateAsync(It.IsAny<Case>())).ReturnsAsync(
            new Case { Id = 1, CaseNumber = "CASE-2026-0001", Title = "New Case", Description = "Desc", Status = "Open", CreatedBy = new User { FullName = "Admin" } }
        );

        var controller = CreateController(mockRepo);
        var request    = new CreateCaseRequest("New Case", "A new forensic case");

        // Act
        var result = await controller.Create(request);

        // Assert
        result.Should().BeOfType<CreatedAtActionResult>();
    }

    // ── Delete tests ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ExistingCase_ReturnsNoContent()
    {
        // Arrange
        var mockRepo = new Mock<ICaseRepository>();
        mockRepo.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

        var controller = CreateController(mockRepo);

        // Act
        var result = await controller.Delete(1);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Delete_NonExistentCase_ReturnsNotFound()
    {
        // Arrange
        var mockRepo = new Mock<ICaseRepository>();
        mockRepo.Setup(r => r.DeleteAsync(999)).ReturnsAsync(false);

        var controller = CreateController(mockRepo);

        // Act
        var result = await controller.Delete(999);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }
}
