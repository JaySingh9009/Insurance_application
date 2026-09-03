package com.insurance.demo.serviceImpl;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.dto.LoginRequest;
import com.insurance.demo.dto.LoginResponse;
import com.insurance.demo.dto.RegisterRequest;
import com.insurance.demo.dto.UserResponse;
import com.insurance.demo.dto.VerifyOtpRequest;
import com.insurance.demo.entity.User;
import com.insurance.demo.enums.Role;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.DuplicateEmailException;
import com.insurance.demo.exception.InactiveUserException;
import com.insurance.demo.exception.InvalidCredentialsException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.repository.UserRepository;
import com.insurance.demo.security.JwtService;
import com.insurance.demo.security.TokenBlacklistService;
import com.insurance.demo.service.AuthService;
import com.insurance.demo.service.OtpService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final TokenBlacklistService tokenBlacklistService;
    
    
    
//Registration implementation
    @Override
    @Transactional
    public String register(RegisterRequest request) {
        log.info("Registering new customer: {}", request.getEmail());

        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            if (user.isActive()) {
                log.warn("Registration failed - email already active: {}", request.getEmail());
                throw new DuplicateEmailException("Email already registered: " + request.getEmail());
            }
            log.info("User already exists but is unverified (pending activation). Updating info and sending new OTP: {}", request.getEmail());
            user.setFullName(request.getFullName());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setMobileNumber(request.getMobileNumber());
        } else {
            user = User.builder()
                    .fullName(request.getFullName())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .mobileNumber(request.getMobileNumber())
                    .role(Role.CUSTOMER)
                    .active(false)
                    .build();
        }

        user = userRepository.save(user);

        // Send OTP only to the channel the user chose
        String channel = request.getVerificationChannel();
        otpService.createAndSendOtp(user, channel);

        String destination = "email".equalsIgnoreCase(channel)
                ? "your email (" + user.getEmail() + ")"
                : "your mobile number (" + user.getMobileNumber() + ") via SMS";

        return "Registration successful. A 6-digit OTP has been sent to "
                + destination + ". Please verify to activate your account.";
    }

//After register Otp verification
    @Override
    @Transactional
    public UserResponse verifyOtp(VerifyOtpRequest request) {
        log.info("OTP verification for email={} via channel={}",
                request.getEmail(), request.getChannel());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with email: " + request.getEmail()));

        if (user.isActive()) {
            throw new BadRequestException("Account is already verified and active.");
        }

        otpService.verifyOtp(user, request.getOtp(), request.getChannel());

        user.setActive(true);
        userRepository.save(user);
        log.info("Account activated: userId={}", user.getId());

        return mapToUserResponse(user);
    }

    
//Login 
    @Override
    public LoginResponse login(LoginRequest request) {
        log.info("Login attempt for: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed - user not found: {}", request.getEmail());
                    return new InvalidCredentialsException("Invalid email or password");
                });

        if (!user.isActive()) {
            log.warn("Login attempt by inactive or deactivated user: {}", request.getEmail());
            throw new InactiveUserException(
                    "Your account is deactivated. Please contact support or admin.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed - incorrect password for: {}", request.getEmail());
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);
        log.info("Login successful: userId={}, role={}", user.getId(), user.getRole());

        return new LoginResponse(token, user.getEmail(), user.getRole().name(), user.getFullName(), user.getMobileNumber());
    }

    
    @Override
    public void logout(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            long remainingMs = jwtService.getRemainingExpirationMs(token);
            if (remainingMs > 0) {
                tokenBlacklistService.blacklistToken(token, remainingMs);
                log.info("Successfully processed logout and token blacklisting.");
            } else {
                log.warn("Token remaining expiration time is <= 0 ms, skipping Redis blacklisting.");
            }
        } else {
            log.warn("Logout endpoint invoked without valid Bearer Authorization header Received: {}", authHeader);
        }
    }

//Mapping user response after verifying otp
    private UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getRole(),
                user.isActive()
        );
    }
}