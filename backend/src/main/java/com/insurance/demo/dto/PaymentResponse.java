package com.insurance.demo.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PaymentResponse {

    private Long paymentId;
    private Long policyId;
    private String policyNumber;
    private String customerName;
    private Double amount;
    private String paymentMode;
    private String transactionReference;
    private String paymentStatus;
    private LocalDateTime paymentDate;
}