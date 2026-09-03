package com.insurance.demo.repository;

import com.insurance.demo.entity.InsuranceProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<InsuranceProduct, Long> {

    boolean existsByProductName(String productName);

    boolean existsByProductNameAndProductIdNot(String productName, Long productId);

    Page<InsuranceProduct> findAll(Pageable pageable);

    Page<InsuranceProduct> findByActiveTrue(Pageable pageable);
}