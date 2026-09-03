package com.insurance.demo.repository;

import com.insurance.demo.entity.PolicyPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PolicyPlanRepository extends JpaRepository<PolicyPlan, Long> {

    List<PolicyPlan> findByProductProductId(Long productId);

    Page<PolicyPlan> findByProductProductId(Long productId, Pageable pageable);

    Page<PolicyPlan> findByProductProductIdAndActiveTrue(Long productId, Pageable pageable);

    Page<PolicyPlan> findByActiveTrue(Pageable pageable);

    boolean existsByProductProductIdAndPlanNameIgnoreCase(Long productId, String planName);
}
