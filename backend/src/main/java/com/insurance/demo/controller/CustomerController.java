package com.insurance.demo.controller;

import com.insurance.demo.dto.CustomerRequest;
import com.insurance.demo.dto.CustomerResponse;
import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.security.CustomUserDetails;
import com.insurance.demo.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Tag(name = "Customer Profile", description = "Endpoints for customer profile management")
public class CustomerController {

    private final CustomerService customerService;

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/profile")
    @Operation(summary = "Create customer profile (Customer only)")
    public ResponseEntity<CustomerResponse> createProfile(
            @Valid @RequestBody CustomerRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(customerService.createProfile(
                        request,
                        principal.getUser().getId()));
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @PutMapping("/profile")
    @Operation(summary = "Update customer profile (Customer only)")
    public ResponseEntity<CustomerResponse> updateProfile(
            @Valid @RequestBody CustomerRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(
                customerService.updateProfile(
                        request,
                        principal.getUser().getId()));
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/profile")
    @Operation(summary = "Get my customer profile (Customer only)")
    public ResponseEntity<CustomerResponse> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(
                customerService.getMyProfile(
                        principal.getUser().getId()));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    @GetMapping
    @Operation(summary = "Get all customers with pagination (Admin/Officer)")
    public ResponseEntity<PagedResponse<CustomerResponse>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(
                customerService.getAllCustomers(
                        page,
                        size,
                        sortBy,
                        sortDir));
    }


}