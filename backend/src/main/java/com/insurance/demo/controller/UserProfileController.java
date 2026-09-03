package com.insurance.demo.controller;

import com.insurance.demo.dto.UserResponse;
import com.insurance.demo.entity.User;
import com.insurance.demo.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Profile", description = "Endpoints for logged-in user profile")
public class UserProfileController {

    @GetMapping("/profile")
    @Operation(summary = "Get current user profile (Admin/Officer/Customer)")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal CustomUserDetails principal) {
        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.badRequest().build();
        }
        User user = principal.getUser();
        UserResponse response = new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getRole(),
                user.isActive()
        );
        return ResponseEntity.ok(response);
    }
}
