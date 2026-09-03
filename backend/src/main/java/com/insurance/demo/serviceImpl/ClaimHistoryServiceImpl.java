package com.insurance.demo.serviceImpl;

import com.insurance.demo.dto.ClaimHistoryResponse;
import com.insurance.demo.entity.Claim;
import com.insurance.demo.enums.Role;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.exception.UnauthorizedAccessException;
import com.insurance.demo.repository.ClaimRepository;
import com.insurance.demo.repository.ClaimStatusHistoryRepository;
import com.insurance.demo.service.ClaimHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClaimHistoryServiceImpl implements ClaimHistoryService {

    private final ClaimStatusHistoryRepository historyRepository;
    private final ClaimRepository claimRepository;

    @Override
    public List<ClaimHistoryResponse> getClaimHistory(Long claimId, Long currentUserId, String userRole) {

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with ID: " + claimId));

        // CUSTOMER: only allowed to view history of their OWN claims
        if (Role.CUSTOMER.name().equals(userRole)) {
            Long claimOwnerUserId = claim.getPolicy().getCustomer().getUser().getId();
            if (!claimOwnerUserId.equals(currentUserId)) {
                throw new UnauthorizedAccessException(
                        "You are not authorized to view the history of this claim");
            }
        }
        // ADMIN and OFFICER: allowed to view any claim's history (no restriction)

        return historyRepository.findByClaimClaimId(claimId)
                .stream()
                .map(h -> ClaimHistoryResponse.builder()
                        .historyId(h.getHistoryId())
                        .previousStatus(h.getPreviousStatus() != null ? h.getPreviousStatus().name() : null)
                        .newStatus(h.getNewStatus().name())
                        .remarks(h.getRemarks())
                        .updatedBy(h.getUpdatedBy() != null ? h.getUpdatedBy().getFullName() : "SYSTEM")
                        .updatedAt(h.getUpdatedAt())
                        .build())
                .toList();
    }
}