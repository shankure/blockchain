using SecureTrace.API.Models;

namespace SecureTrace.API.Services;

public interface IJwtService
{
    string GenerateToken(User user);
}
