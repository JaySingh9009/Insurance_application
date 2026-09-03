package com.insurance.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 100, message = "Product name must be between 3 and 100 characters")
    private String productName;

    @NotBlank(message = "Product type is required")
    @Pattern(
        regexp = "(?i)HEALTH|MOTOR|LIFE|TRAVEL",
        message = "Product type must be one of: HEALTH, MOTOR, LIFE, TRAVEL"
    )
    private String productType;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Description must be between 10 and 1000 characters")
    private String description;
}