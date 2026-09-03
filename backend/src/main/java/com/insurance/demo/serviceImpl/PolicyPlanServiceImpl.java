package com.insurance.demo.serviceImpl;

import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.PolicyPlanRequest;
import com.insurance.demo.dto.PolicyPlanResponse;
import com.insurance.demo.entity.InsuranceProduct;
import com.insurance.demo.entity.PolicyPlan;
import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.enums.ProductType;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.DuplicateResourceException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.repository.PolicyPlanRepository;
import com.insurance.demo.repository.ProductRepository;
import com.insurance.demo.service.PolicyPlanService;
import com.insurance.demo.util.PaginationValidator;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PolicyPlanServiceImpl implements PolicyPlanService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("planName", "premiumAmount", "coverageAmount", "createdAt");

    private final PolicyPlanRepository planRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public PolicyPlanResponse createPlan(PolicyPlanRequest request) {
        log.info("Creating plan for productId={}", request.getProductId());

        InsuranceProduct product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.getProductId()));

        if (!product.isActive()) {
            log.warn("Cannot add plan to inactive product: productId={}", product.getProductId());
            throw new BadRequestException("Cannot add a plan to an inactive product");
        }

        String sanitizedPlanName = request.getPlanName() != null ? request.getPlanName().trim() : "";
        if (planRepository.existsByProductProductIdAndPlanNameIgnoreCase(product.getProductId(), sanitizedPlanName)) {
            log.warn("Plan creation failed - duplicate plan name '{}' for productId={}", sanitizedPlanName, product.getProductId());
            throw new DuplicateResourceException("A policy plan with name '" + sanitizedPlanName + "' already exists for this product.");
        }

        // Business rule: coverage must be greater than premium
        if (request.getCoverageAmount() <= request.getPremiumAmount()) {
            throw new BadRequestException("Coverage amount must be greater than premium amount");
        }

        PremiumType premiumType = parsePremiumType(request.getPremiumType());
        if (product.getProductType() == ProductType.TRAVEL) {
            if (premiumType != PremiumType.ONE_TIME) {
                throw new BadRequestException("Travel policy plans must have premiumType set to ONE_TIME");
            }
        } else {
            if (premiumType != PremiumType.ANNUAL) {
                throw new BadRequestException("Health, Motor, and Life policy plans must have premiumType set to ANNUAL");
            }
        }

        PolicyPlan plan = PolicyPlan.builder()
                .product(product)
                .planName(request.getPlanName())
                .coverageAmount(request.getCoverageAmount())
                .premiumAmount(request.getPremiumAmount())
                .premiumType(premiumType)
                .duration(request.getDuration())
                .termsAndConditions(request.getTermsAndConditions())
                .active(true)
                .build();

        plan = planRepository.save(plan);
        log.info("Plan created: planId={}", plan.getPlanId());
        return mapToResponse(plan);
    }



    @Override
    public PagedResponse<PolicyPlanResponse> getAllPlans(int page, int size, String sortBy, String sortDir) {
        Pageable pageable = PaginationValidator.buildPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
        Page<PolicyPlan> planPage = planRepository.findAll(pageable);
        return PagedResponse.from(planPage, this::mapToResponse);
    }

    @Override
    public PagedResponse<PolicyPlanResponse> getActivePlans(int page, int size, String sortBy, String sortDir) {
        Pageable pageable = PaginationValidator.buildPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
        Page<PolicyPlan> planPage = planRepository.findByActiveTrue(pageable);
        return PagedResponse.from(planPage, this::mapToResponse);
    }



    @Override
    public void deactivatePlan(Long id) {
        PolicyPlan plan = findPlan(id);
        plan.setActive(false);
        planRepository.save(plan);
        log.info("Plan deactivated: planId={}", id);
    }

    @Override
    public void activatePlan(Long id) {
        PolicyPlan plan = findPlan(id);
        plan.setActive(true);
        planRepository.save(plan);
        log.info("Plan activated: planId={}", id);
    }

    private PolicyPlan findPlan(Long id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with ID: " + id));
    }

    private PremiumType parsePremiumType(String type) {
        try {
            return PremiumType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid premium type: " + type + ". Valid values: ONE_TIME, MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL");
        }
    }



    private PolicyPlanResponse mapToResponse(PolicyPlan p) {
        return PolicyPlanResponse.builder()
                .planId(p.getPlanId())
                .planName(p.getPlanName())
                .coverageAmount(p.getCoverageAmount())
                .premiumAmount(p.getPremiumAmount())
                .premiumType(p.getPremiumType() != null ? p.getPremiumType().name() : "ANNUAL")
                .duration(p.getDuration())
                .termsAndConditions(p.getTermsAndConditions())
                .active(p.isActive())
                .productId(p.getProduct().getProductId())
                .productName(p.getProduct().getProductName())
                .productType(p.getProduct().getProductType() != null ? p.getProduct().getProductType().name() : null)
                .createdAt(p.getCreatedAt())
                .build();
    }
}