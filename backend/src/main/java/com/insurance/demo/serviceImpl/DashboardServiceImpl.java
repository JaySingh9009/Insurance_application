package com.insurance.demo.serviceImpl;

import org.springframework.stereotype.Service;

import com.insurance.demo.dto.AdminDashboardResponse;
import com.insurance.demo.repository.ClaimRepository;
import com.insurance.demo.repository.CustomerRepository;
import com.insurance.demo.repository.PolicyRepository;
import com.insurance.demo.repository.ProductRepository;
import com.insurance.demo.service.DashboardService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl
        implements DashboardService {

    private final CustomerRepository customerRepository;

    private final PolicyRepository policyRepository;

    private final ClaimRepository claimRepository;

    private final ProductRepository productRepository;

    @Override
    public AdminDashboardResponse
    getAdminDashboard() {

        return AdminDashboardResponse
                .builder()
                .totalCustomers(
                        customerRepository.count())
                .totalPolicies(
                        policyRepository.count())
                .totalClaims(
                        claimRepository.count())
                .totalProducts(
                        productRepository.count())
                .build();
    }
}