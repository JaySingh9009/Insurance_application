package com.insurance.demo.service;

import com.insurance.demo.dto.LoginRequest;
import com.insurance.demo.dto.LoginResponse;
import com.insurance.demo.dto.RegisterRequest;
import com.insurance.demo.dto.UserResponse;
import com.insurance.demo.dto.VerifyOtpRequest;

public interface AuthService {

    /**
     * Registers a new CUSTOMER. Saves the user as inactive and sends an OTP to their email.
     * Returns a message asking the user to verify their OTP.
     */
    String register(RegisterRequest request);

    /**
     * Verifies the OTP submitted by the user. Activates the account on success.
     */
    UserResponse verifyOtp(VerifyOtpRequest request);

    /**
     * Logs in an already-verified and active user; returns a JWT token.
     */
    LoginResponse login(LoginRequest request);

    /**
     * Logs out user and invalidates the JWT token in Redis blacklist.
     */
    void logout(String authHeader);
}
