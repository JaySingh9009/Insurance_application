package com.insurance.demo.service;

import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.PolicyPlanRequest;
import com.insurance.demo.dto.PolicyPlanResponse;

public interface PolicyPlanService {
    PolicyPlanResponse createPlan(PolicyPlanRequest request);

    PagedResponse<PolicyPlanResponse> getAllPlans(int page, int size, String sortBy, String sortDir);

    PagedResponse<PolicyPlanResponse> getActivePlans(int page, int size, String sortBy, String sortDir);

    void deactivatePlan(Long id);
    void activatePlan(Long id);
}