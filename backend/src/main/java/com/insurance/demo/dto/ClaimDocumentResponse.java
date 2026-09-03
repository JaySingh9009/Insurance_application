package com.insurance.demo.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClaimDocumentResponse {

    private Long documentId;
    private String documentName;
    private String documentType;
    private String documentUrl;      // Cloudinary HTTPS URL (publicly accessible)
    private String publicId;         // Cloudinary public_id (for deletion if needed)
    private Long claimId;
    private LocalDateTime uploadedAt;
}