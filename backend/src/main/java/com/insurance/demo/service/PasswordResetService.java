package com.insurance.demo.service;

import com.insurance.demo.dto.ForgotPasswordRequest;
import com.insurance.demo.dto.ResetPasswordRequest;
import com.insurance.demo.dto.VerifyForgotPasswordOtpRequest;

public interface PasswordResetService {

    /**
     * Step 1: Registered email check karo aur OTP bhejo.
     */
    String sendForgotPasswordOtp(ForgotPasswordRequest request);

    /**
     * Step 2: OTP verify karo (password abhi change nahi hoga).
     */
    String verifyForgotPasswordOtp(VerifyForgotPasswordOtpRequest request);

    /**
     * Step 3: Naya password set karo (OTP verified hona chahiye).
     */
    String resetPassword(ResetPasswordRequest request);
}