package com.insurance.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.insurance.demo.entity.ClaimDocument;

public interface ClaimDocumentRepository extends JpaRepository<ClaimDocument, Long> {

	List<ClaimDocument> findByClaimClaimId(Long claimId);
}