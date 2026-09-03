package com.insurance.demo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.ClaimHistoryResponse;
import com.insurance.demo.security.CustomUserDetails;
import com.insurance.demo.service.ClaimHistoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/claim-history")
@RequiredArgsConstructor
public class ClaimHistoryController {

    private final ClaimHistoryService claimHistoryService;

    @PreAuthorize("hasAnyRole('CUSTOMER', 'OFFICER', 'ADMIN')")
    @GetMapping("/{claimId}")
    public ResponseEntity<List<ClaimHistoryResponse>> getHistory(
            @PathVariable Long claimId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        Long currentUserId = principal.getUser().getId();
        String userRole = principal.getUser().getRole().name();

        return ResponseEntity.ok(
                claimHistoryService.getClaimHistory(claimId, currentUserId, userRole));
    }
}