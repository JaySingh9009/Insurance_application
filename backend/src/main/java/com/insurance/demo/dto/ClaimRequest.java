package com.insurance.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ClaimRequest {

    @NotNull(message = "Policy ID is required")
    private Long policyId;

    @NotNull(message = "Claim amount is required")
    @DecimalMin(value = "1.0", message = "Claim amount must be at least 1")
    @Positive(message = "Claim amount must be positive")
    @jakarta.validation.constraints.Digits(integer = 10, fraction = 0, message = "Claim amount cannot contain decimal or floating values")
    private Double claimAmount;

    @NotBlank(message = "Claim reason is required")
    @Size(min = 10, max = 1000, message = "Claim reason must be between 10 and 1000 characters")
    private String claimReason;

    @NotNull(message = "Incident date is required")
    @PastOrPresent(message = "Incident date must not be a future date")
    private LocalDate incidentDate;

    @NotNull(message = "At least one document is required")
    @Size(min = 1, max = 10, message = "You must submit between 1 and 10 documents")
    private List<ClaimDocumentRequest> documents;

    /**
     * Optional — only relevant for MOTOR policies.
     * Allowed values: ACCIDENT, THEFT, FIRE, NATURAL_CALAMITY, BREAKDOWN, OTHER
     */
    private String claimCategory;
}