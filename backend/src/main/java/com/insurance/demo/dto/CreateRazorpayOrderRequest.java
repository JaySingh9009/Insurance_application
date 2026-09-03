package com.insurance.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateRazorpayOrderRequest {

    @NotNull(message = "Policy ID is required")
    private Long policyId;

    private Double amount;
}
