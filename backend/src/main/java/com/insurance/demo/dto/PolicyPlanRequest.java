package com.insurance.demo.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PolicyPlanRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotBlank(message = "Plan name is required")
    @Size(min = 3, max = 100, message = "Plan name must be between 3 and 100 characters")
    private String planName;

    @NotNull(message = "Coverage amount is required")
    @DecimalMin(value = "1000.0", message = "Coverage amount must be at least 1000")
    @DecimalMax(value = "100000000.0", message = "Coverage amount must not exceed 10 crore")
    private Double coverageAmount;

    @NotNull(message = "Premium amount is required")
    @DecimalMin(value = "100.0", message = "Premium amount must be at least 100")
    @DecimalMax(value = "10000000.0", message = "Premium amount must not exceed 1 crore")
    private Double premiumAmount;

    @NotBlank(message = "Premium type is required")
    @Pattern(
        regexp = "(?i)ONE_TIME|MONTHLY|QUARTERLY|SEMI_ANNUAL|ANNUAL",
        message = "Premium type must be ONE_TIME for Travel,  ANNUAL for rest of Products"
    )
    private String premiumType;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1")
    @Max(value = 365, message = "Duration must not exceed 365 (years for standard plans; days for Travel plans)")
    private Integer duration;

    @NotBlank(message = "Terms and conditions are required")
    @Size(min = 20, max = 2000, message = "Terms and conditions must be between 20 and 2000 characters")
    private String termsAndConditions;

	
}