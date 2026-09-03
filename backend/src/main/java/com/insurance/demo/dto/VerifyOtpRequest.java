package com.insurance.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyOtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "OTP is required")
    private String otp;

    /**
     * Must match the channel chosen during registration.
     * "email" → validates OTP from inbox
     * "phone" → validates OTP from SMS
     */
    @NotBlank(message = "Channel is required. Use 'email' or 'phone'")
    @Pattern(regexp = "(?i)email|phone",
             message = "Channel must be 'email' or 'phone'")
    private String channel;
}