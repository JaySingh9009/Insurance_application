package com.insurance.demo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PurchasePolicyRequest {

    @NotNull(message = "Plan ID is required")
    private Long planId;

    private String selectedPremiumType;

    /**
     * startDate is optional for LIFE/HEALTH/MOTOR — defaults to today if not provided.
     * For TRAVEL policies this is the departure date (required).
     */
    private LocalDate startDate;

    /**
     * Only used for TRAVEL policies — the customer's return/end date.
     * For LIFE/HEALTH/MOTOR this is ignored; endDate is auto-calculated
     * from startDate + plan.durationInYears.
     */
    private LocalDate endDate;

    // ── Motor-specific fields (only required when productType = MOTOR) ────────
    private String vehicleRegistrationNo;  // e.g. "MH12AB1234"
    private String vehicleMakeModel;       // e.g. "Maruti Swift"
    private Integer vehicleYear;           // manufacturing year, e.g. 2019
    // Note: idvAmount is NOT sent by client — calculated server-side via IRDA depreciation

    // ── Health-specific fields (only used when productType = HEALTH) ──────────
    private List<String> preExistingDiseases;

    // ── Life-specific fields (only used when productType = LIFE) ────────────
    private String nomineeName;
    private String nomineeRelation;
}