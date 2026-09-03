package com.insurance.demo.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClaimResponse {

    private Long claimId;
    private String claimNumber;
    private Long policyId;
    private String policyNumber;
    private Double claimAmount;
    private String claimReason;
    private LocalDate incidentDate;
    private String status;
    private String officerRemarks;
    private String adminRemarks;
    private String customerName;
    private Long assignedOfficerId;
    private String assignedOfficerName;
    private Long assignedOfficerActiveTaskCount;
    private String claimCategory;  // Motor-specific: ACCIDENT, THEFT, FIRE, NATURAL_CALAMITY, BREAKDOWN, OTHER
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}