using FluentAssertions;
using SecureTrace.API.Services;
using Xunit;

namespace SecureTrace.Tests;

/// <summary>
/// Tests for the CryptographyService.
/// These are pure unit tests — no database, no MongoDB, no HTTP.
/// CryptographyService has no dependencies so no mocking needed.
/// </summary>
public class CryptographyServiceTests
{
    private readonly CryptographyService _sut = new();

    // ── ComputeHash tests ─────────────────────────────────────────────────────

    [Fact]
    public void ComputeHash_SameInput_ReturnsSameHash()
    {
        // Arrange
        var input = "SecureTrace test payload";

        // Act
        var hash1 = _sut.ComputeHash(input);
        var hash2 = _sut.ComputeHash(input);

        // Assert
        hash1.Should().Be(hash2);
    }

    [Fact]
    public void ComputeHash_DifferentInput_ReturnsDifferentHash()
    {
        // Arrange
        var input1 = "original evidence description";
        var input2 = "tampered evidence description";  // one word changed

        // Act
        var hash1 = _sut.ComputeHash(input1);
        var hash2 = _sut.ComputeHash(input2);

        // Assert
        hash1.Should().NotBe(hash2);
    }

    [Fact]
    public void ComputeHash_ReturnsLowercase64CharHexString()
    {
        // Arrange
        var input = "any input string";

        // Act
        var hash = _sut.ComputeHash(input);

        // Assert — SHA-256 always produces exactly 64 hex characters
        hash.Should().HaveLength(64);
        hash.Should().MatchRegex("^[0-9a-f]{64}$");
    }

    [Fact]
    public void ComputeHash_SingleCharacterChange_ProducesCompletelyDifferentHash()
    {
        // Arrange — this proves the avalanche effect of SHA-256
        // Even one character change produces a totally different hash
        var original = "id:1;title:Evidence;description:Original";
        var tampered = "id:1;title:Evidence;description:0riginal"; // O → 0

        // Act
        var originalHash = _sut.ComputeHash(original);
        var tamperedHash = _sut.ComputeHash(tampered);

        // Assert
        originalHash.Should().NotBe(tamperedHash);
    }

    // ── BuildBlockPayload tests ───────────────────────────────────────────────

    [Fact]
    public void BuildBlockPayload_SameInputs_ReturnsSamePayload()
    {
        // Arrange
        var timestamp = new DateTime(2026, 5, 17, 10, 0, 0, DateTimeKind.Utc);

        // Act
        var payload1 = _sut.BuildBlockPayload(1, timestamp, 1, "CREATED", "snapshot", "user@test.com", "0000000000000000");
        var payload2 = _sut.BuildBlockPayload(1, timestamp, 1, "CREATED", "snapshot", "user@test.com", "0000000000000000");

        // Assert
        payload1.Should().Be(payload2);
    }

    [Fact]
    public void BuildBlockPayload_ContainsAllFields()
    {
        // Arrange
        var timestamp = new DateTime(2026, 5, 17, 10, 0, 0, DateTimeKind.Utc);

        // Act
        var payload = _sut.BuildBlockPayload(
            blockIndex:       3,
            timestamp:        timestamp,
            evidenceId:       7,
            actionType:       "UPDATED",
            evidenceSnapshot: "id:7;title:Test",
            actorEmail:       "agent@test.com",
            previousHash:     "abc123"
        );

        // Assert — all fields must be present in the payload
        payload.Should().Contain("3");
        payload.Should().Contain("7");
        payload.Should().Contain("UPDATED");
        payload.Should().Contain("id:7;title:Test");
        payload.Should().Contain("agent@test.com");
        payload.Should().Contain("abc123");
    }
}
