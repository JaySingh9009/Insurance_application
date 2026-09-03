package com.insurance.demo.repository;

import com.insurance.demo.entity.Claim;
import com.insurance.demo.enums.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, Long> {

    Page<Claim> findAll(Pageable pageable);

    Page<Claim> findByPolicyPolicyId(Long policyId, Pageable pageable);

    List<Claim> findByPolicyPolicyId(Long policyId);

    List<Claim> findByPolicyCustomerCustomerId(Long customerId);

    Page<Claim> findByPolicyCustomerCustomerId(Long customerId, Pageable pageable);

    boolean existsByPolicyPolicyIdAndStatusNotIn(Long policyId, List<ClaimStatus> statuses);

    long countByAssignedOfficerIdAndStatusIn(Long officerId, java.util.Collection<ClaimStatus> statuses);


}
