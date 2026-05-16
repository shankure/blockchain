using SecureTrace.API.Models;

namespace SecureTrace.API.Services.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
}
