package com.insurance.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClaimDocumentRequest {

    @NotBlank(message = "Document name is required")
    private String documentName;

    @NotBlank(message = "Document type is required")
    private String documentType;


    @NotBlank(message = "Document URL is required. Upload the file first via POST /api/claim-documents/upload")
    private String documentUrl;


    @NotBlank(message = "Public ID is required. Upload the file first via POST /api/claim-documents/upload")
    private String publicId;
}