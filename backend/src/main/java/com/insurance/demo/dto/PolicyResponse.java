package com.insurance.demo.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PolicyResponse {

    private Long policyId;
    private String policyNumber;
    private String customerName;
    private String customerEmail;
    private Long customerId;
    private String productName;
    private String planName;
    private Long planId;
    private Double coverageAmount;
    private Double premiumAmount;
    private String selectedPremiumType;
    private Double installmentAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Double totalPremiumPaid;
    private LocalDate lastPaymentDate;
    private LocalDate nextPaymentDueDate;
    private LocalDateTime createdAt;

    // Product type — lets frontend detect MOTOR, TRAVEL, HEALTH, LIFE
    private String productType;

    // ── Motor-specific fields (null for non-MOTOR policies) ──────────────────
    private String vehicleRegistrationNo;
    private String vehicleMakeModel;
    private Integer vehicleYear;
    private Double idvAmount;

    // ── Health-specific fields (null for non-HEALTH policies) ────────────────
    private List<String> preExistingDiseases;

    // ── Life-specific fields (null for non-LIFE policies) ───────────────────
    private String nomineeName;
    private String nomineeRelation;
}