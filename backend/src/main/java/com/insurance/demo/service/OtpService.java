package com.insurance.demo.service;

import com.insurance.demo.entity.OtpVerification;
import com.insurance.demo.entity.User;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpVerificationRepository otpRepository;
    private final EmailService emailService;
    private final SmsService smsService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.otp.expiry-minutes:5}")
    private long expiryMinutes;

    /**
     * Generates ONE OTP and sends it to whichever channel the user chose
     * during registration ("email" or "phone"). Only that field is stored;
     * the other remains null.
     */
    @Transactional
    public void createAndSendOtp(User user, String channel) {
        String otp = generateSixDigitOtp();

        OtpVerification.OtpVerificationBuilder builder = OtpVerification.builder()
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
                .used(false);

        if ("email".equalsIgnoreCase(channel)) {
            builder.emailOtp(otp);
            otpRepository.save(builder.build());
            emailService.sendOtp(user.getEmail(), otp);
            log.info("Email OTP sent for userId={}", user.getId());

        } else if ("phone".equalsIgnoreCase(channel)) {
            builder.phoneOtp(otp);
            otpRepository.save(builder.build());
            String formattedPhone = formatToE164(user.getMobileNumber());
            smsService.sendOtp(formattedPhone, otp);
            log.info("SMS OTP sent for userId={}", user.getId());

        } else {
            throw new BadRequestException(
                    "Invalid channel. Accepted values: 'email' or 'phone'.");
        }
    }

    /**
     * Validates OTP against the channel the user picked.
     * Marks the record used on success.
     */
    @Transactional
    public void verifyOtp(User user, String providedOtp, String channel) {
        OtpVerification latestOtp = otpRepository
                .findTopByUserAndUsedFalseOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new BadRequestException(
                        "No active OTP found. Please register again to receive a new OTP."));

        if (latestOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException(
                    "OTP has expired. Please register again to receive a new OTP.");
        }

        if ("email".equalsIgnoreCase(channel)) {
            if (latestOtp.getEmailOtp() == null) {
                throw new BadRequestException(
                        "Your OTP was sent via SMS, not email. Please use channel 'phone'.");
            }
            if (!latestOtp.getEmailOtp().equals(providedOtp)) {
                throw new BadRequestException(
                        "Invalid email OTP. Please check your inbox and try again.");
            }

        } else if ("phone".equalsIgnoreCase(channel)) {
            if (latestOtp.getPhoneOtp() == null) {
                throw new BadRequestException(
                        "Your OTP was sent via email, not SMS. Please use channel 'email'.");
            }
            if (!latestOtp.getPhoneOtp().equals(providedOtp)) {
                throw new BadRequestException(
                        "Invalid phone OTP. Please check your SMS and try again.");
            }

        } else {
            throw new BadRequestException(
                    "Invalid channel. Accepted values: 'email' or 'phone'.");
        }

        latestOtp.setUsed(true);
        otpRepository.save(latestOtp);
        log.info("OTP verified via channel='{}' for userId={}", channel, user.getId());
    }

    private String generateSixDigitOtp() {
        int number = secureRandom.nextInt(900000) + 100000;
        return String.valueOf(number);
    }

    /**
     * Converts 10-digit Indian mobile to E.164 for Twilio.
     * e.g. "9876543210" → "+919876543210"
     */
    private String formatToE164(String mobileNumber) {
        if (mobileNumber == null) return "";
        String digits = mobileNumber.replaceAll("[^0-9]", "");
        if (digits.length() == 10) {
            return "+91" + digits;
        }
        return "+" + digits;
    }
}