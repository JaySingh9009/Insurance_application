package com.insurance.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Used by Insurance Officer to move a claim to UNDER_REVIEW or recommend approve/reject.
 */
@Data
public class OfficerRemarkRequest {

    @NotNull(message = "Target status is required")
    private String targetStatus; // UNDER_REVIEW | RECOMMENDED_APPROVAL | RECOMMENDED_REJECTION

    @NotBlank(message = "Remarks are required")
    @Size(min = 5, max = 500, message = "Remarks must be between 5 and 500 characters")
    private String remarks;
}
