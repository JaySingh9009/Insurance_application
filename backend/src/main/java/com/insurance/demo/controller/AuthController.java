package com.insurance.demo.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.ForgotPasswordRequest;
import com.insurance.demo.dto.LoginRequest;
import com.insurance.demo.dto.LoginResponse;
import com.insurance.demo.dto.RegisterRequest;
import com.insurance.demo.dto.ResetPasswordRequest;
import com.insurance.demo.dto.UserResponse;
import com.insurance.demo.dto.VerifyForgotPasswordOtpRequest;
import com.insurance.demo.dto.VerifyOtpRequest;
import com.insurance.demo.security.CustomUserDetails;
import com.insurance.demo.service.AuthService;
import com.insurance.demo.service.PasswordResetService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Registration, OTP verification, login and password reset")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;  

 
    @PostMapping("/register")
    @Operation(
        summary = "Register a new customer account",
        description = "Creates an inactive account. OTP is sent to the chosen channel (email/phone)."
    )
    public ResponseEntity<Map<String, String>> register(
            @Valid @RequestBody RegisterRequest request) {
        String message = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", message));
    }
    
    

    @PostMapping("/verify-otp")
    @Operation(
        summary = "Verify OTP to activate account",
        description = "Submit the OTP received on your chosen channel to activate your account."
    )
    public ResponseEntity<UserResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }
    
    

    @PostMapping("/login")
    @Operation(
        summary = "Login and receive JWT token",
        description = "Only verified (active) accounts can log in."
    )
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
    
    


    @PostMapping("/forgot-password")
    @Operation(
        summary = "Step 1 – Send password reset OTP",
        description = "Registered email par 6-digit OTP bhejta hai. " +
                      "Email exist nahi karta to 404 milega."
    )
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        String message = passwordResetService.sendForgotPasswordOtp(request);
        return ResponseEntity.ok(Map.of("message", message));
    }
    
    
    

    @PostMapping({"/verify-reset-otp"})
    @Operation(
        summary = "Step 2 – Verify password reset OTP",
        description = "OTP verify karo. Successful hone par Step 3 ke liye aage badho."
    )
    public ResponseEntity<Map<String, String>> verifyForgotPasswordOtp(
            @Valid @RequestBody VerifyForgotPasswordOtpRequest request) {
        String message = passwordResetService.verifyForgotPasswordOtp(request);
        return ResponseEntity.ok(Map.of("message", message));
    }
    
    

    @PostMapping("/reset-password")
    @Operation(
        summary = "Step 3 – Reset password",
        description = "OTP verified hone ke baad naya password set karo. " +
                      "Same email aur OTP bhejni hai jo Step 2 me use ki thi."
    )
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        String message = passwordResetService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", message));
    }
    
    @PostMapping("/logout")
    @Operation(
        summary = "Logout user and invalidate JWT token in Redis blacklist",
        description = "Invalidates current Bearer JWT token so it cannot be reused."
    )
    public ResponseEntity<Map<String, String>> logout(
            HttpServletRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        String authHeader = request.getHeader("Authorization");
        authService.logout(authHeader);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

}