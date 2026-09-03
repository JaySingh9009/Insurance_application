package com.insurance.demo.repository;

import com.insurance.demo.entity.Policy;
import com.insurance.demo.enums.PolicyStatus;
import com.insurance.demo.enums.ProductType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface PolicyRepository extends JpaRepository<Policy, Long> {

	Page<Policy> findAll(Pageable pageable);

	List<Policy> findByCustomerCustomerId(Long customerId);

	Page<Policy> findByCustomerCustomerId(Long customerId, Pageable pageable);

	boolean existsByPlan_Product_ProductId(Long productId);

	boolean existsByCustomerCustomerIdAndPlanProductProductTypeAndStatusIn(Long customerId, ProductType productType,
			Collection<PolicyStatus> statuses);

	boolean existsByCustomerCustomerIdAndPlanPlanIdAndStatusIn(Long customerId, Long planId,
			Collection<PolicyStatus> statuses);

	boolean existsByVehicleRegistrationNoAndStatusIn(String vehicleRegistrationNo, Collection<PolicyStatus> statuses);

	List<Policy> findByStatusAndNextPaymentDueDateNotNull(PolicyStatus status);

	@Query("SELECT p FROM Policy p WHERE p.customer.customerId = :customerId "
			+ "AND p.plan.product.productType = com.insurance.demo.enums.ProductType.TRAVEL "
			+ "AND p.status IN :statuses " + "AND p.startDate <= :newEndDate AND p.endDate >= :newStartDate")
	List<Policy> findOverlappingTravelPolicies(@Param("customerId") Long customerId,
			@Param("newStartDate") LocalDate newStartDate, @Param("newEndDate") LocalDate newEndDate,
			@Param("statuses") Collection<PolicyStatus> statuses);
}