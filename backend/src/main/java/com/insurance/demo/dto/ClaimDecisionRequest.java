package com.insurance.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Used by Admin to make a final APPROVED or REJECTED decision on a claim.
 */
@Data
public class ClaimDecisionRequest {

    @NotNull(message = "Decision is required")
    @Pattern(
        regexp = "(?i)APPROVED|REJECTED",
        message = "Decision must be either APPROVED or REJECTED"
    )
    private String decision;

    @NotBlank(message = "Admin remarks are required when making a final claim decision")
    @Size(min = 5, max = 500, message = "Admin remarks must be between 5 and 500 characters")
    private String adminRemarks;
}