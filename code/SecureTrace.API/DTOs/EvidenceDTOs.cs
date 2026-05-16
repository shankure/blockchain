namespace SecureTrace.API.DTOs;

public record CreateEvidenceRequest(
    string Title,
    string Description,
    string EvidenceType,   // "Photo", "Video", "Document", "Other"
    string FileReference,  // path or URL to the file
    DateTime CollectedAt,
    int CaseId
);

public record UpdateEvidenceRequest(
    string Title,
    string Description,
    string EvidenceType,
    string FileReference,
    DateTime CollectedAt
);

public record EvidenceResponse(
    int Id,
    string Title,
    string Description,
    string EvidenceType,
    string FileReference,
    DateTime CollectedAt,
    DateTime CreatedAt,
    int CaseId,
    string CaseNumber,
    string UploadedByFullName
);
