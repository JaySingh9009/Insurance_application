package com.insurance.demo.repository;

import com.insurance.demo.entity.PremiumPayment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<PremiumPayment, Long> {

    List<PremiumPayment> findByPolicyPolicyId(Long policyId);

    Page<PremiumPayment> findByPolicyPolicyId(Long policyId, Pageable pageable);

    boolean existsByTransactionReference(String transactionReference);

    Optional<PremiumPayment> findByTransactionReference(String transactionReference);
    
    Page<PremiumPayment> findByPolicyCustomerUserId(Long userId, Pageable pageable);
}