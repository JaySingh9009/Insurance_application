package com.insurance.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.insurance.demo.entity.ClaimStatusHistory;

public interface ClaimStatusHistoryRepository extends JpaRepository<ClaimStatusHistory, Long> {

	List<ClaimStatusHistory> findByClaimClaimId(Long claimId);
}