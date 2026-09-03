package com.insurance.demo.repository;

import com.insurance.demo.entity.OtpVerification;
import com.insurance.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByUserAndUsedFalseOrderByCreatedAtDesc(User user);
}
