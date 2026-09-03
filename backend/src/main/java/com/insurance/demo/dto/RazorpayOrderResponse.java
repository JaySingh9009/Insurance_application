package com.insurance.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RazorpayOrderResponse {

    private String orderId;
    private Double amount;
    private String currency;
    private String keyId;
    private Long policyId;
    private String policyNumber;
    private String customerName;
    private String customerEmail;
    private String planName;
}
