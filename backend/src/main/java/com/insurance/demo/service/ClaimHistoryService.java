package com.insurance.demo.service;

import com.insurance.demo.dto.ClaimHistoryResponse;

import java.util.List;

public interface ClaimHistoryService {
    List<ClaimHistoryResponse> getClaimHistory(Long claimId, Long currentUserId, String userRole);
}