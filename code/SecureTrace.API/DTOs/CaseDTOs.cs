namespace SecureTrace.API.DTOs;

public record CreateCaseRequest(
    string Title,
    string Description
);

public record UpdateCaseRequest(
    string Title,
    string Description,
    string Status  // "Open", "Closed", "Archived"
);

public record CaseResponse(
    int Id,
    string CaseNumber,
    string Title,
    string Description,
    string Status,
    DateTime CreatedAt,
    string CreatedByFullName
);
