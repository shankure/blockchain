namespace SecureTrace.API.DTOs;

public record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string Role  // "Admin", "User", "Auditor"
);

public record LoginRequest(
    string Email,
    string Password
);

public record AuthResponse(
    string Token,
    string FullName,
    string Email,
    string Role,
    DateTime ExpiresAt
);
