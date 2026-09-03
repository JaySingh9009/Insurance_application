package com.insurance.demo.service;

import com.insurance.demo.dto.IssuePolicyRequest;
import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.PolicyResponse;
import com.insurance.demo.dto.PurchasePolicyRequest;

public interface PolicyService {

	PolicyResponse purchasePolicy(PurchasePolicyRequest request, Long userId);

	PolicyResponse issuePolicy(IssuePolicyRequest request);

	PolicyResponse cancelPolicy(Long policyId, Long requestingUserId, String role);

	PolicyResponse getPolicyById(Long policyId);

	PagedResponse<PolicyResponse> getAllPolicies(int page, int size, String sortBy, String sortDir);

	PagedResponse<PolicyResponse> getMyPolicies(Long userId, int page, int size, String sortBy, String sortDir);
}