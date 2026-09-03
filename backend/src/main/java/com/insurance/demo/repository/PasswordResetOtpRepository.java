package com.insurance.demo.repository;

import com.insurance.demo.entity.PasswordResetOtp;
import com.insurance.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    /**
     * Sabse latest unused OTP dhundho (verified bhi nahi, used bhi nahi).
     * Step 1 ke baad Step 2 verify karne ke liye.
     */
    Optional<PasswordResetOtp> findTopByUserAndUsedFalseOrderByCreatedAtDesc(User user);

    /**
     * Verified OTP dhundho jo abhi used nahi — reset-password step ke liye.
     */
    Optional<PasswordResetOtp> findTopByUserAndVerifiedTrueAndUsedFalseOrderByCreatedAtDesc(User user);
}