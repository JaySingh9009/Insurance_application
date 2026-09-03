package com.insurance.demo.service;

import com.insurance.demo.dto.*;

public interface ClaimService {
    ClaimResponse submitClaim(ClaimRequest request, Long userId);
    ClaimResponse updateOfficerClaimStatus(Long claimId, OfficerRemarkRequest request, Long officerUserId);
    ClaimResponse makeClaimDecision(Long claimId, ClaimDecisionRequest request, Long adminUserId);

    PagedResponse<ClaimResponse> getAllClaims(int page, int size, String sortBy, String sortDir);
    PagedResponse<ClaimResponse> getMyClaims(Long userId, int page, int size, String sortBy, String sortDir);

    ClaimResponse assignOfficer(Long claimId, Long officerId);
}