package com.insurance.demo.serviceImpl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.json.JSONObject;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.config.RazorpayConfig;
import com.insurance.demo.dto.CreateRazorpayOrderRequest;
import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.PaymentResponse;
import com.insurance.demo.dto.RazorpayOrderResponse;
import com.insurance.demo.dto.VerifyRazorpayPaymentRequest;
import com.insurance.demo.entity.Customer;
import com.insurance.demo.entity.Policy;
import com.insurance.demo.entity.PremiumPayment;
import com.insurance.demo.entity.User;
import com.insurance.demo.enums.PaymentMethod;
import com.insurance.demo.enums.PaymentStatus;
import com.insurance.demo.enums.PolicyStatus;
import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.enums.ProductType;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.DuplicateResourceException;
import com.insurance.demo.exception.PaymentGatewayException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.exception.UnauthorizedAccessException;
import com.insurance.demo.repository.CustomerRepository;
import com.insurance.demo.repository.PaymentRepository;
import com.insurance.demo.repository.PolicyRepository;
import com.insurance.demo.service.PaymentService;
import com.insurance.demo.util.PaginationValidator;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("paymentDate", "amount", "paymentStatus");

    private final PaymentRepository paymentRepository;
    private final PolicyRepository policyRepository;
    private final CustomerRepository customerRepository;
    private final RazorpayConfig razorpayConfig;
    private final ObjectProvider<RazorpayClient> razorpayClientProvider;

    @Override
    public PagedResponse<PaymentResponse> getAllPayments(int page, int size, String sortBy, String sortDir) {
        Pageable pageable = PaginationValidator.buildPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
        Page<PremiumPayment> paymentPage = paymentRepository.findAll(pageable);
        return PagedResponse.from(paymentPage, this::mapToResponse);
    }

    private PaymentResponse mapToResponse(PremiumPayment p) {
        return PaymentResponse.builder()
                .paymentId(p.getPaymentId())
                .policyId(p.getPolicy().getPolicyId())
                .policyNumber(p.getPolicy().getPolicyNumber())
                .customerName(p.getPolicy().getCustomer() != null && p.getPolicy().getCustomer().getUser() != null 
                        ? p.getPolicy().getCustomer().getUser().getFullName() : null)
                .amount(p.getAmount())
                .paymentMode(p.getPaymentMethod().name())
                .transactionReference(p.getTransactionReference())
                .paymentStatus(p.getPaymentStatus().name())
                .paymentDate(p.getPaymentDate())
                .build();
    }
    
    @Override
    public PagedResponse<PaymentResponse> getMyPayments(
            Long userId,
            int page,
            int size,
            String sortBy,
            String sortDir) {

        Pageable pageable = PaginationValidator.buildPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
        Page<PremiumPayment> paymentPage = paymentRepository.findByPolicyCustomerUserId(userId, pageable);
        return PagedResponse.from(paymentPage, this::mapToResponse);
    }

    @Override
    @Transactional
    public RazorpayOrderResponse createRazorpayOrder(CreateRazorpayOrderRequest request, Long userId, String role) {
        Policy policy = validateAndGetPolicyForPayment(request.getPolicyId(), userId, role);

        Double payableAmount = calculatePayableAmount(policy, request.getAmount());

        String orderId = null;
        RazorpayClient razorpayClient = razorpayClientProvider.getIfAvailable();
        if (razorpayClient == null) {
            throw new PaymentGatewayException("Payment gateway is currently unavailable. Please try again later.");
        }

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", Math.round(payableAmount * 100)); // amount in paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

            Order order = razorpayClient.orders.create(orderRequest);
            orderId = order.get("id");
            log.info("Razorpay order created: {}", orderId);
        } catch (Exception e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            throw new PaymentGatewayException("Payment gateway is currently unavailable. Please try again later.");
        }

        return RazorpayOrderResponse.builder()
                .orderId(orderId)
                .amount(payableAmount)
                .currency("INR")
                .keyId(razorpayConfig.getKeyId())
                .policyId(policy.getPolicyId())
                .policyNumber(policy.getPolicyNumber())
                .customerName(policy.getCustomer().getUser().getFullName())
                .customerEmail(policy.getCustomer().getUser().getEmail())
                .planName(policy.getPlan().getPlanName())
                .build();
    }

    @Override
    @Transactional
    public PaymentResponse verifyRazorpayPayment(VerifyRazorpayPaymentRequest request, Long userId, String role) {
        Policy policy = validateAndGetPolicyForPayment(request.getPolicyId(), userId, role);

        if (paymentRepository.findByTransactionReference(request.getRazorpayPaymentId()).isPresent()) {
            throw new DuplicateResourceException("Payment with reference '" + request.getRazorpayPaymentId() + "' already processed.");
        }

        // ─── Razorpay Signature Verification ─────────────────────────────────────
        // Razorpay sends: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
        // We must verify this signature to confirm the payment is genuine and not forged.
        try {
            JSONObject verificationAttributes = new JSONObject();
            verificationAttributes.put("razorpay_order_id", request.getRazorpayOrderId());
            verificationAttributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
            verificationAttributes.put("razorpay_signature", request.getRazorpaySignature());

            boolean isValidSignature = Utils.verifyPaymentSignature(
                    verificationAttributes,
                    razorpayConfig.getKeySecret()
            );

            if (!isValidSignature) {
                log.warn("Razorpay signature verification FAILED for paymentId={}, orderId={}",
                        request.getRazorpayPaymentId(), request.getRazorpayOrderId());
                throw new BadRequestException(
                        "Payment verification failed: Invalid Razorpay signature. Payment may be forged.");
            }

            log.info("Razorpay signature verified successfully for paymentId={}", request.getRazorpayPaymentId());

        } catch (RazorpayException e) {
            log.error("Razorpay signature verification error: {}", e.getMessage());
            throw new BadRequestException(
                    "Payment verification failed due to a gateway error. Please contact support.");
        }
        // ─────────────────────────────────────────────────────────────────────────

        Double paidAmount = calculatePayableAmount(policy, request.getAmount());
        
        PremiumPayment payment = PremiumPayment.builder()
                .policy(policy)
                .amount(paidAmount)
                .paymentMethod(PaymentMethod.RAZORPAY)
                .transactionReference(request.getRazorpayPaymentId())
                .paymentStatus(PaymentStatus.SUCCESS)
                .paymentDate(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        // Update Policy Status and Next Payment Due Date
        double updatedTotalPaid = (policy.getTotalPremiumPaid() != null ? policy.getTotalPremiumPaid() : 0.0) + paidAmount;
        policy.setTotalPremiumPaid(updatedTotalPaid);
        policy.setLastPaymentDate(LocalDate.now());

        // Reactivate LAPSED / INACTIVE / PENDING_PAYMENT policy back to ACTIVE
        policy.setStatus(PolicyStatus.ACTIVE);

        // Calculate next due date according to selected premium frequency
        LocalDate baseDate = policy.getNextPaymentDueDate() != null && policy.getNextPaymentDueDate().isAfter(LocalDate.now())
                ? policy.getNextPaymentDueDate()
                : LocalDate.now();

        PremiumType pType = policy.getSelectedPremiumType() != null
                ? policy.getSelectedPremiumType()
                : (policy.getPlan() != null ? policy.getPlan().getPremiumType() : PremiumType.ANNUAL);

        boolean isTravelOrOneTime = (policy.getPlan() != null && policy.getPlan().getProduct() != null 
                && policy.getPlan().getProduct().getProductType() == ProductType.TRAVEL)
                || pType == PremiumType.ONE_TIME;

        LocalDate nextDue;
        if (isTravelOrOneTime) {
            nextDue = null;
        } else {
            switch (pType) {
                case MONTHLY -> nextDue = baseDate.plusMonths(1);
                case QUARTERLY -> nextDue = baseDate.plusMonths(3);
                case SEMI_ANNUAL -> nextDue = baseDate.plusMonths(6);
                case ANNUAL -> nextDue = baseDate.plusYears(1);
                default -> nextDue = baseDate.plusYears(1);
            }
        }

        policy.setNextPaymentDueDate(nextDue);
        policyRepository.save(policy);

        log.info("Razorpay Payment VERIFIED & SUCCESS: Transaction Ref: {}, Policy: {}, Amount: {}, Next Due: {}",
                request.getRazorpayPaymentId(), policy.getPolicyNumber(), paidAmount, nextDue);

        return mapToResponse(payment);
    }

    private Policy validateAndGetPolicyForPayment(Long policyId, Long userId, String role) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with ID: " + policyId));

        if (policy.getCustomer() == null || policy.getCustomer().getUser() == null || policy.getPlan() == null) {
            throw new ResourceNotFoundException("Customer profile, user account, or policy plan not found for policy ID: " + policyId);
        }

        if ("CUSTOMER".equals(role)) {
            Customer customer = customerRepository.findByUser_Id(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found for user: " + userId));
            if (!policy.getCustomer().getCustomerId().equals(customer.getCustomerId())) {
                throw new UnauthorizedAccessException("You can only pay for your own policy.");
            }
        }

        if (policy.getStatus() == PolicyStatus.CANCELLED || policy.getStatus() == PolicyStatus.EXPIRED) {
            throw new BadRequestException("Cannot make payment on a " + policy.getStatus() + " policy.");
        }

        boolean isTravel = policy.getPlan() != null && policy.getPlan().getProduct() != null &&
                policy.getPlan().getProduct().getProductType() == ProductType.TRAVEL;

        if (isTravel && LocalDate.now().isAfter(policy.getStartDate())) {
            policy.setStatus(PolicyStatus.EXPIRED);
            policyRepository.save(policy);
            throw new BadRequestException("Payment for Travel policy must be completed on or before the departure date (" + policy.getStartDate() + ").");
        }

        if (policy.getStatus() == PolicyStatus.ACTIVE &&
            policy.getNextPaymentDueDate() != null &&
            LocalDate.now().isBefore(policy.getNextPaymentDueDate())) {
            throw new BadRequestException("Your premium for this cycle is already paid! Next installment is due on " + policy.getNextPaymentDueDate() + ".");
        }

        return policy;
    }

    private Double calculatePayableAmount(Policy policy, Double requestedAmount) {
        if (requestedAmount != null && requestedAmount > 0) {
            return requestedAmount;
        }
        return policy.getInstallmentAmount() != null && policy.getInstallmentAmount() > 0
                ? policy.getInstallmentAmount()
                : policy.getPlan().getPremiumAmount();
    }
}