package com.insurance.demo.controller;


import com.insurance.demo.dto.OfficerWorkloadResponse;
import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.UserResponse;
import com.insurance.demo.security.CustomUserDetails;
import com.insurance.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Admin endpoints for managing users")
public class UserController {

    private final UserService userService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/officers")
    @Operation(summary = "Create a new Insurance Officer (Admin only)")
    public ResponseEntity<UserResponse> createOfficer(
            @Valid @RequestBody com.insurance.demo.dto.CreateOfficerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createOfficer(request));
    }

    @GetMapping("/officers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get active Insurance Officers list (Admin only)")
    public ResponseEntity<java.util.List<UserResponse>> getOfficers() {
        PagedResponse<UserResponse> page = userService.getAllUsers(0, 100, "fullName", "asc", com.insurance.demo.enums.Role.OFFICER);
        java.util.List<UserResponse> activeOfficers = page.getRecords().stream()
                .filter(UserResponse::isActive)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(activeOfficers);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/officers-workload")
    @Operation(summary = "Get active officers with live active task count — for claim assignment dropdown (Admin only)")
    public ResponseEntity<List<OfficerWorkloadResponse>> getOfficersWithWorkload() {
        return ResponseEntity.ok(userService.getOfficersWithWorkload());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    @Operation(summary = "Get all users with pagination (Admin only)")
    public ResponseEntity<PagedResponse<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) com.insurance.demo.enums.Role role) {
        return ResponseEntity.ok(userService.getAllUsers(page, size, sortBy, sortDir, role));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate a user (Admin only)")
    public ResponseEntity<UserResponse> activateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.activateUser(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a user (Admin only) — cannot deactivate yourself")
    public ResponseEntity<UserResponse> deactivateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(userService.deactivateUser(id, principal.getUser().getId()));
    }


}
