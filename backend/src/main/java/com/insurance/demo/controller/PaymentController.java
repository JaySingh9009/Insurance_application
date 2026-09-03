package com.insurance.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.CreateRazorpayOrderRequest;
import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.PaymentResponse;
import com.insurance.demo.dto.RazorpayOrderResponse;
import com.insurance.demo.dto.VerifyRazorpayPaymentRequest;
import com.insurance.demo.security.CustomUserDetails;
import com.insurance.demo.service.PaymentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Premium Payments", description = "Record and view premium payments")
public class PaymentController {
	

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    @PreAuthorize("hasAnyRole('CUSTOMER')")
    @Operation(summary = "Create Razorpay Order for Policy Payment")
    public ResponseEntity<RazorpayOrderResponse> createRazorpayOrder(
            @Valid @RequestBody CreateRazorpayOrderRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        String role = principal.getUser().getRole().name();
        return ResponseEntity.ok(paymentService.createRazorpayOrder(request, principal.getUser().getId(), role));
    }

    
    
    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('CUSTOMER')")
    @Operation(summary = "Verify Razorpay Payment Signature and activate policy")
    public ResponseEntity<PaymentResponse> verifyRazorpayPayment(
            @Valid @RequestBody VerifyRazorpayPaymentRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
    	
        String role = principal.getUser().getRole().name();
        return ResponseEntity.ok(paymentService.verifyRazorpayPayment(request, principal.getUser().getId(), role));
    }



    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    @GetMapping
    @Operation(summary = "Get all payments (Admin/Officer)")
    public ResponseEntity<PagedResponse<PaymentResponse>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(paymentService.getAllPayments(page, size, sortBy, sortDir));
    }
    
    
    
    
    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/my")
    public ResponseEntity<PagedResponse<PaymentResponse>> getMyPayments(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(
                paymentService.getMyPayments(
                        principal.getUser().getId(),
                        page,
                        size,
                        sortBy,
                        sortDir
                )
        );
    }
}