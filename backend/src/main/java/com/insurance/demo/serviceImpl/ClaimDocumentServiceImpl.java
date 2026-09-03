
package com.insurance.demo.serviceImpl;

import com.insurance.demo.dto.ClaimDocumentRequest;
import com.insurance.demo.dto.ClaimDocumentResponse;
import com.insurance.demo.dto.FileUploadResponse;
import com.insurance.demo.entity.Claim;
import com.insurance.demo.entity.ClaimDocument;
import com.insurance.demo.enums.DocumentCategory;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.repository.ClaimDocumentRepository;
import com.insurance.demo.repository.ClaimRepository;
import com.insurance.demo.service.ClaimDocumentService;
import com.insurance.demo.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClaimDocumentServiceImpl implements ClaimDocumentService {

    private final ClaimRepository claimRepository;
    private final ClaimDocumentRepository documentRepository;
    private final CloudinaryService cloudinaryService;

    // Document types that are IMAGE based
    private static final Set<String> IMAGE_DOCUMENT_TYPES = Set.of(
            "PHOTO", "SELFIE", "SIGNATURE", "PROPERTY_PHOTO", "VEHICLE_PHOTO"
    );

    // Document types that are PDF based
    private static final Set<String> PDF_DOCUMENT_TYPES = Set.of(
            "MEDICAL_REPORT", "POLICE_FIR", "HOSPITAL_BILL", "DEATH_CERTIFICATE",
            "INSURANCE_POLICY", "ID_PROOF", "CLAIM_FORM", "OTHER"
    );
    
    
//
    @Override
    public FileUploadResponse preUploadDocument(String documentName, String documentType, MultipartFile file) {
        log.info("Pre-uploading document '{}' (type={}) to Cloudinary", documentName, documentType);

        DocumentCategory category = resolveCategory(documentType);
        String folder = category == DocumentCategory.IMAGE
                ? "claim-documents/images"
                : "claim-documents/pdfs";

        String[] result = cloudinaryService.uploadFile(file, folder, category);
        String secureUrl = result[0];
        String publicId  = result[1];

        log.info("Pre-upload successful: publicId={}, url={}", publicId, secureUrl);

        return FileUploadResponse.builder()
                .documentUrl(secureUrl)
                .publicId(publicId)
                .documentName(documentName)
                .documentType(documentType)
                .message("File uploaded successfully. Use documentUrl and publicId in your claim submission body.")
                .build();
    }

    @Override
    public void linkDocumentsToClaim(Long claimId, List<ClaimDocumentRequest> documents) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with ID: " + claimId));

        List<ClaimDocument> docs = documents.stream()
                .map(req -> ClaimDocument.builder()
                        .claim(claim)
                        .documentName(req.getDocumentName())
                        .documentType(req.getDocumentType())
                        .documentUrl(req.getDocumentUrl())
                        .publicId(req.getPublicId())
                        .build())
                .toList();

        documentRepository.saveAll(docs);
        log.info("Linked {} documents to claimId={}", docs.size(), claimId);
    }

    @Override
    public List<ClaimDocumentResponse> getDocuments(Long claimId) {
        return documentRepository.findByClaimClaimId(claimId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Decides category based on documentType string sent by user
    private DocumentCategory resolveCategory(String documentType) {
        if (documentType == null || documentType.isBlank()) {
            throw new BadRequestException("documentType must not be blank");
        }
        String upper = documentType.toUpperCase();
        if (IMAGE_DOCUMENT_TYPES.contains(upper)) {
            return DocumentCategory.IMAGE;
        }
        if (PDF_DOCUMENT_TYPES.contains(upper)) {
            return DocumentCategory.PDF;
        }
        throw new BadRequestException(
                "Unknown documentType: '" + documentType + "'. " +
                "Allowed image types: " + IMAGE_DOCUMENT_TYPES + ". " +
                "Allowed PDF types: " + PDF_DOCUMENT_TYPES
        );
    }

    private ClaimDocumentResponse mapToResponse(ClaimDocument d) {
        return ClaimDocumentResponse.builder()
                .documentId(d.getDocumentId())
                .documentName(d.getDocumentName())
                .documentType(d.getDocumentType())
                .documentUrl(d.getDocumentUrl())
                .publicId(d.getPublicId())
                .claimId(d.getClaim().getClaimId())
                .uploadedAt(d.getUploadedAt())
                .build();
    }
}

