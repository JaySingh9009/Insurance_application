package com.insurance.demo.serviceImpl;

import com.insurance.demo.dto.ForgotPasswordRequest;
import com.insurance.demo.dto.ResetPasswordRequest;
import com.insurance.demo.dto.VerifyForgotPasswordOtpRequest;
import com.insurance.demo.entity.PasswordResetOtp;
import com.insurance.demo.entity.User;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.repository.PasswordResetOtpRepository;
import com.insurance.demo.repository.UserRepository;
import com.insurance.demo.service.EmailService;
import com.insurance.demo.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.otp.expiry-minutes:5}")
    private long expiryMinutes;


    @Override
    @Transactional
    public String sendForgotPasswordOtp(ForgotPasswordRequest request) {
        log.info("Forgot password OTP request for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No account found with email: " + request.getEmail()));


        if (!user.isActive()) {
            throw new BadRequestException(
                    "Your account is not yet activated. Please verify your registration OTP first.");
        }

        // OTP generate karo aur save karo
        String otp = generateSixDigitOtp();

        PasswordResetOtp resetOtp = PasswordResetOtp.builder()
                .user(user)
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
                .verified(false)
                .used(false)
                .build();

        passwordResetOtpRepository.save(resetOtp);

        // Email bhejo
        emailService.sendPasswordResetOtp(user.getEmail(), otp);

        log.info("Password reset OTP sent for userId={}", user.getId());
        return "Password reset OTP has been sent to your registered email: " + maskEmail(user.getEmail());
    }

    // ─────────────────────────────────────────────────────────
    // Step 2: OTP verify karo
    // ─────────────────────────────────────────────────────────
    @Override
    @Transactional
    public String verifyForgotPasswordOtp(VerifyForgotPasswordOtpRequest request) {
        log.info("Verifying forgot password OTP for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No account found with email: " + request.getEmail()));

        // Latest unused OTP dhundho
        PasswordResetOtp resetOtp = passwordResetOtpRepository
                .findTopByUserAndUsedFalseOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new BadRequestException(
                        "No active OTP found. Please request a new OTP."));

        // Expiry check karo
        if (resetOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException(
                    "OTP has expired. Please request a new password reset OTP.");
        }

        // OTP match karo
        if (!resetOtp.getOtp().equals(request.getOtp())) {
            throw new BadRequestException(
                    "Invalid OTP. Please check your email and try again.");
        }

        // Mark as verified (used nahi — abhi password change nahi hua)
        resetOtp.setVerified(true);
        passwordResetOtpRepository.save(resetOtp);

        log.info("Password reset OTP verified for userId={}", user.getId());
        return "OTP verified successfully. You can now set your new password.";
    }


    @Override
    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        log.info("Reset password request for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No account found with email: " + request.getEmail()));

        PasswordResetOtp resetOtp = passwordResetOtpRepository
                .findTopByUserAndVerifiedTrueAndUsedFalseOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new BadRequestException(
                        "OTP not verified. Please complete OTP verification first."));

        // Double-check: OTP abhi bhi valid hai?
        if (resetOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException(
                    "OTP session has expired. Please request a new password reset.");
        }

        // OTP match karo (extra safety — same OTP jo verify hua tha)
        if (!resetOtp.getOtp().equals(request.getOtp())) {
            throw new BadRequestException(
                    "Invalid OTP. Please try the forgot password process again.");
        }


        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetOtp.setUsed(true);
        passwordResetOtpRepository.save(resetOtp);

        log.info("Password reset successful for userId={}", user.getId());
        return "Password has been reset successfully. You can now login with your new password.";
    }


    private String generateSixDigitOtp() {
        int number = secureRandom.nextInt(900000) + 100000;
        return String.valueOf(number);
    }


    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];
        if (local.length() <= 2) return email;
        return local.substring(0, 2) + "****@" + domain;
    }
}