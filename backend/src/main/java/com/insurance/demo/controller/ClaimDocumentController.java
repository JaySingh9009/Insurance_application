package com.insurance.demo.controller;

import com.insurance.demo.dto.ClaimDocumentResponse;
import com.insurance.demo.dto.FileUploadResponse;
import com.insurance.demo.service.ClaimDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/claim-documents")
@RequiredArgsConstructor
@Tag(name = "Claim Documents", description = "Upload files to Cloudinary before submitting a claim")
public class ClaimDocumentController {

    private final ClaimDocumentService claimDocumentService;


    @PreAuthorize("hasAnyRole('CUSTOMER', 'OFFICER', 'ADMIN')")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "STEP 1: Upload a claim document to Cloudinary (do this BEFORE submitting claim)",
        description = "Returns documentUrl and publicId. Include both in your ClaimRequest.documents[] array."
    )
    public ResponseEntity<FileUploadResponse> preUploadDocument(
            @RequestParam("documentName") String documentName,
            @RequestParam("documentType") String documentType,
            @RequestParam("file") MultipartFile file) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(claimDocumentService.preUploadDocument(documentName, documentType, file));
    }

    
    @GetMapping("/{claimId}")
    @Operation(summary = "Get all documents for a claim (returns Cloudinary URLs)")
    public ResponseEntity<List<ClaimDocumentResponse>> getDocuments(@PathVariable Long claimId) {
        return ResponseEntity.ok(claimDocumentService.getDocuments(claimId));
    }
}