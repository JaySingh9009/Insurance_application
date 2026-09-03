package com.insurance.demo.service;

import com.insurance.demo.dto.CreateRazorpayOrderRequest;
import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.PaymentResponse;
import com.insurance.demo.dto.RazorpayOrderResponse;
import com.insurance.demo.dto.VerifyRazorpayPaymentRequest;

public interface PaymentService {
    RazorpayOrderResponse createRazorpayOrder(CreateRazorpayOrderRequest request, Long userId, String role);
    PaymentResponse verifyRazorpayPayment(VerifyRazorpayPaymentRequest request, Long userId, String role);

    PagedResponse<PaymentResponse> getAllPayments(int page, int size, String sortBy, String sortDir);
    PagedResponse<PaymentResponse> getMyPayments(
            Long userId,
            int page,
            int size,
            String sortBy,
            String sortDir
    );
}