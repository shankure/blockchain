using MongoDB.Driver;
using SecureTrace.API.Models;

namespace SecureTrace.API.Data;

/// <summary>
/// Provides access to MongoDB collections.
/// Registered as a singleton in Program.cs.
/// </summary>
public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        var connectionString = configuration["MongoDB:ConnectionString"]
            ?? throw new InvalidOperationException("MongoDB:ConnectionString is not configured.");

        var databaseName = configuration["MongoDB:DatabaseName"]
            ?? throw new InvalidOperationException("MongoDB:DatabaseName is not configured.");

        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);

        // Ensure the BlockIndex field has an ascending unique index
        // so block ordering is always deterministic and fast to query
        EnsureIndexes();
    }

    /// <summary>
    /// The cryptographic audit ledger collection.
    /// </summary>
    public IMongoCollection<AuditBlock> AuditBlocks =>
        _database.GetCollection<AuditBlock>("audit_blocks");

    private void EnsureIndexes()
    {
        var indexModel = new CreateIndexModel<AuditBlock>(
            Builders<AuditBlock>.IndexKeys.Ascending(b => b.BlockIndex),
            new CreateIndexOptions { Unique = true }
        );
        AuditBlocks.Indexes.CreateOne(indexModel);
    }
}
