package com.insurance.demo.controller;

import com.insurance.demo.dto.*;
import com.insurance.demo.security.CustomUserDetails;
import com.insurance.demo.service.ClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
@Tag(name = "Claims", description = "Claim submission and lifecycle management")
public class ClaimController {

    private final ClaimService claimService;

    
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping
    @Operation(summary = "Submit a new claim (Customer only)")
    public ResponseEntity<ClaimResponse> submitClaim(
            @Valid @RequestBody ClaimRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(claimService.submitClaim(request, principal.getUser().getId()));
    }

    
    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/my")
    @Operation(summary = "Get my claims (Customer only)")
    public ResponseEntity<PagedResponse<ClaimResponse>> getMyClaims(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(claimService.getMyClaims(
                principal.getUser().getId(), page, size, sortBy, sortDir));
    }

    
    @PreAuthorize("hasRole('OFFICER')")
    @PatchMapping("/{id}/review")
    @Operation(summary = "Insurance Officer moves claim to UNDER_REVIEW")
    public ResponseEntity<ClaimResponse> reviewClaim(
            @PathVariable Long id,
            @Valid @RequestBody OfficerRemarkRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        request.setTargetStatus("UNDER_REVIEW");
        return ResponseEntity.ok(claimService.updateOfficerClaimStatus(id, request, principal.getUser().getId()));
    }

    @PreAuthorize("hasRole('OFFICER')")
    @PatchMapping("/{id}/recommend")
    @Operation(summary = "Insurance Officer recommends APPROVAL or REJECTION")
    public ResponseEntity<ClaimResponse> recommendClaim(
            @PathVariable Long id,
            @Valid @RequestBody OfficerRemarkRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(claimService.updateOfficerClaimStatus(id, request, principal.getUser().getId()));
    }


    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/decide")
    @Operation(summary = "Admin makes final APPROVED or REJECTED decision")
    public ResponseEntity<ClaimResponse> makeDecision(
            @PathVariable Long id,
            @Valid @RequestBody ClaimDecisionRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(claimService.makeClaimDecision(id, request, principal.getUser().getId()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/assign-officer")
    @Operation(summary = "Admin assigns an Insurance Officer to a claim (Admin only)")
    public ResponseEntity<ClaimResponse> assignOfficer(
            @PathVariable Long id,
            @RequestParam(required = false) Long officerId,
            @RequestBody(required = false) AssignOfficerRequest request) {
        Long finalOfficerId = (officerId != null) ? officerId : (request != null ? request.getOfficerId() : null);
        if (finalOfficerId == null) {
            throw new com.insurance.demo.exception.BadRequestException("Officer ID must be provided.");
        }
        return ResponseEntity.ok(claimService.assignOfficer(id, finalOfficerId));
    }


    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    @GetMapping
    @Operation(summary = "Get all claims (Admin/Insurance Officer)")
    public ResponseEntity<PagedResponse<ClaimResponse>> getAllClaims(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(claimService.getAllClaims(page, size, sortBy, sortDir));
    }





}