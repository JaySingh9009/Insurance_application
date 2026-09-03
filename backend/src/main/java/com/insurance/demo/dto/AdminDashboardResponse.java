package com.insurance.demo.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdminDashboardResponse {

    private Long totalCustomers;

    private Long totalPolicies;

    private Long totalClaims;

    private Long totalProducts;
}