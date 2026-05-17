using FluentAssertions;
using Moq;
using MongoDB.Driver;
using SecureTrace.API.Data;
using SecureTrace.API.Models;
using SecureTrace.API.Services;
using Xunit;

namespace SecureTrace.Tests;

/// <summary>
/// Tests for the VerificationService — the chain verification engine.
///
/// We mock MongoDbContext so we don't need a real MongoDB instance.
/// This is the most important test class — it proves that:
///   1. A valid chain returns IsValid = true
///   2. A tampered block returns IsValid = false
///   3. A broken chain link returns IsValid = false
/// </summary>
public class VerificationServiceTests
{
    private readonly CryptographyService _crypto = new();

    /// <summary>
    /// Builds a valid chain of AuditBlocks with correct hashes.
    /// Used as the baseline for all tests.
    /// </summary>
    private List<AuditBlock> BuildValidChain(int blockCount = 2)
    {
        var blocks       = new List<AuditBlock>();
        var previousHash = "0000000000000000";

        for (int i = 1; i <= blockCount; i++)
        {
            var timestamp = new DateTime(2026, 5, 17, 10, i, 0, DateTimeKind.Utc);
            var snapshot  = $"id:{i};title:Evidence {i};description:Test";

            var payload = _crypto.BuildBlockPayload(
                blockIndex:       i,
                timestamp:        timestamp,
                evidenceId:       i,
                actionType:       "CREATED",
                evidenceSnapshot: snapshot,
                actorEmail:       "admin@test.com",
                previousHash:     previousHash
            );

            var currentHash = _crypto.ComputeHash(payload);

            blocks.Add(new AuditBlock
            {
                BlockIndex       = i,
                PreviousHash     = previousHash,
                CurrentHash      = currentHash,
                EvidenceId       = i,
                ActionType       = "CREATED",
                EvidenceSnapshot = snapshot,
                ActorEmail       = "admin@test.com",
                Timestamp        = timestamp
            });

            previousHash = currentHash;
        }

        return blocks;
    }

    /// <summary>
    /// Creates a VerificationService with a mocked MongoDB that returns the given blocks.
    /// </summary>
    private VerificationService BuildService(List<AuditBlock> blocks)
    {
        // Mock the async cursor that MongoDB uses to return results
        var mockCursor = new Mock<IAsyncCursor<AuditBlock>>();
        mockCursor
            .SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true)
            .ReturnsAsync(false);
        mockCursor
            .Setup(c => c.Current)
            .Returns(blocks);

        // Mock the collection
        var mockCollection = new Mock<IMongoCollection<AuditBlock>>();
        mockCollection
            .Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<AuditBlock>>(),
                It.IsAny<FindOptions<AuditBlock, AuditBlock>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockCursor.Object);

        // Mock the context
        var mockContext = new Mock<MongoDbContext>();
        mockContext
            .Setup(m => m.AuditBlocks)
            .Returns(mockCollection.Object);

        return new VerificationService(mockContext.Object, _crypto);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task VerifyChain_ValidChain_ReturnsIsValidTrue()
    {
        // Arrange
        var blocks  = BuildValidChain(blockCount: 2);
        var service = BuildService(blocks);

        // Act
        var result = await service.VerifyChainAsync();

        // Assert
        result.IsValid.Should().BeTrue();
        result.TotalBlocks.Should().Be(2);
        result.Details.Should().AllSatisfy(d => d.IsValid.Should().BeTrue());
        result.Details.Should().AllSatisfy(d => d.FailureReason.Should().BeNull());
    }

    [Fact]
    public async Task VerifyChain_TamperedDescription_ReturnsIsValidFalse()
    {
        // Arrange — build a valid chain, then tamper with Block 1's snapshot
        // This simulates someone editing the evidence description directly in MongoDB
        var blocks = BuildValidChain(blockCount: 2);
        blocks[0].EvidenceSnapshot = "id:1;title:Evidence 1;description:TAMPERED DATA";
        // Note: CurrentHash is NOT updated — this is what a real attacker would do

        var service = BuildService(blocks);

        // Act
        var result = await service.VerifyChainAsync();

        // Assert
        result.IsValid.Should().BeFalse();
        result.Details[0].IsValid.Should().BeFalse();
        result.Details[0].FailureReason.Should().Contain("Hash mismatch");
    }

    [Fact]
    public async Task VerifyChain_BrokenChainLink_ReturnsIsValidFalse()
    {
        // Arrange — build a valid chain, then break the link between blocks
        // This simulates someone inserting or deleting a block from the middle
        var blocks = BuildValidChain(blockCount: 2);
        blocks[1].PreviousHash = "0000000000000000";  // points to genesis instead of Block 1

        var service = BuildService(blocks);

        // Act
        var result = await service.VerifyChainAsync();

        // Assert
        result.IsValid.Should().BeFalse();
        result.Details[1].FailureReason.Should().NotBeNull();
        result.Details[1].IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task VerifyChain_EmptyLedger_ReturnsIsValidTrue()
    {
        // Arrange — empty ledger is valid (no evidence uploaded yet)
        var service = BuildService(new List<AuditBlock>());

        // Act
        var result = await service.VerifyChainAsync();

        // Assert
        result.IsValid.Should().BeTrue();
        result.TotalBlocks.Should().Be(0);
        result.Message.Should().Contain("empty");
    }

    [Fact]
    public async Task VerifyChain_TamperedActorEmail_ReturnsIsValidFalse()
    {
        // Arrange — attacker tries to change who uploaded the evidence
        var blocks = BuildValidChain(blockCount: 1);
        blocks[0].ActorEmail = "attacker@evil.com";  // changed but hash not updated

        var service = BuildService(blocks);

        // Act
        var result = await service.VerifyChainAsync();

        // Assert
        result.IsValid.Should().BeFalse();
        result.Details[0].FailureReason.Should().Contain("Hash mismatch");
    }
}
