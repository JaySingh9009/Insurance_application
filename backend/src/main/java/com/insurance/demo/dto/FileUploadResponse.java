package com.insurance.demo.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FileUploadResponse {
    private String documentUrl;   // Cloudinary HTTPS URL — use this in ClaimRequest
    private String publicId;      // Cloudinary public_id
    private String documentName;
    private String documentType;
    private String message;
}
