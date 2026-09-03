package com.insurance.demo.service;

import com.insurance.demo.dto.ClaimDocumentResponse;
import com.insurance.demo.dto.FileUploadResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ClaimDocumentService {

    /**
     * STEP 1 — Upload file to Cloudinary before claim is submitted.
     * Returns documentUrl + publicId to be included in ClaimRequest body.
     */
    FileUploadResponse preUploadDocument(String documentName, String documentType, MultipartFile file);

    /**
     * STEP 2 — Called internally by ClaimService after claim is saved.
     * Links already-uploaded Cloudinary documents to the newly created claim.
     */
    void linkDocumentsToClaim(Long claimId, List<com.insurance.demo.dto.ClaimDocumentRequest> documents);

    /**
     * Get all documents attached to a claim.
     */
    List<ClaimDocumentResponse> getDocuments(Long claimId);
}