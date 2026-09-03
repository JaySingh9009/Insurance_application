package com.insurance.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * Used by Admin/Agent to issue a policy to a specific customer.
 */
@Data
public class IssuePolicyRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Plan ID is required")
    private Long planId;

    private String selectedPremiumType;

    private LocalDate startDate;

    /**
     * Required for TRAVEL policies (return date).
     * For LIFE/HEALTH/MOTOR, endDate is calculated automatically from plan duration.
     */
    private LocalDate endDate;

    // ── Motor-specific fields (only required when productType = MOTOR) ────────
    private String vehicleRegistrationNo;
    private String vehicleMakeModel;
    private Integer vehicleYear;

    // ── Health-specific fields (only used when productType = HEALTH) ──────────
    private List<String> preExistingDiseases;

    // ── Life-specific fields (only used when productType = LIFE) ────────────
    private String nomineeName;
    private String nomineeRelation;
}
