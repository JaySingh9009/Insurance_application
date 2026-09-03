//package com.insurance.demo;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.Mockito.*;
//
//import java.time.LocalDate;
//import java.util.ArrayList;
//import java.util.List;
//import java.util.Optional;
//
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//
//import com.insurance.demo.dto.*;
//import com.insurance.demo.entity.*;
//import com.insurance.demo.enums.*;
//import com.insurance.demo.exception.*;
//import com.insurance.demo.repository.*;
//import com.insurance.demo.service.ClaimDocumentService;
//import com.insurance.demo.serviceImpl.*;
//
//@ExtendWith(MockitoExtension.class)
//public class BusinessLogicTests {
//
//    @Mock
//    private PolicyRepository policyRepository;
//
//    @Mock
//    private PolicyPlanRepository planRepository;
//
//    @Mock
//    private CustomerRepository customerRepository;
//
//    @Mock
//    private PaymentRepository paymentRepository;
//
//    @Mock
//    private ClaimRepository claimRepository;
//
//    @Mock
//    private UserRepository userRepository;
//
//    @Mock
//    private ProductRepository productRepository;
//
//    @Mock
//    private ClaimStatusHistoryRepository historyRepository;
//
//    @Mock
//    private ClaimDocumentService claimDocumentService;
//
//    @InjectMocks
//    private PolicyServiceImpl policyService;
//
//    @InjectMocks
//    private PaymentServiceImpl paymentService;
//
//    @InjectMocks
//    private ClaimServiceImpl claimService;
//
//    @InjectMocks
//    private CustomerServiceImpl customerService;
//
//    @InjectMocks
//    private PolicyPlanServiceImpl planService;
//
//    private Customer customer;
//    private User user;
//    private InsuranceProduct lifeProduct;
//    private InsuranceProduct healthProduct;
//    private PolicyPlan lifePlan;
//    private PolicyPlan healthPlan;
//    private Policy policy;
//
//    @BeforeEach
//    void setUp() {
//        user = User.builder()
//                .id(1L)
//                .fullName("Test User")
//                .email("test@gmail.com")
//                .mobileNumber("9999999999")
//                .role(Role.CUSTOMER)
//                .active(true)
//                .build();
//
//        customer = Customer.builder()
//                .customerId(10L)
//                .user(user)
//                .dateOfBirth(LocalDate.of(1990, 1, 1))
//                .address("Test Address")
//                .city("Test City")
//                .state("Test State")
//                .pincode("123456")
//                .build();
//
//        lifeProduct = InsuranceProduct.builder()
//                .productId(1L)
//                .productName("Life Care")
//                .productType(ProductType.LIFE)
//                .active(true)
//                .build();
//
//        healthProduct = InsuranceProduct.builder()
//                .productId(2L)
//                .productName("Health Shield")
//                .productType(ProductType.HEALTH)
//                .active(true)
//                .build();
//
//        lifePlan = PolicyPlan.builder()
//                .planId(101L)
//                .product(lifeProduct)
//                .planName("Life Gold")
//                .coverageAmount(100000.0)
//                .premiumAmount(5000.0)
//                .premiumType(PremiumType.ANNUAL)
//                .durationInYears(5)
//                .active(true)
//                .build();
//
//        healthPlan = PolicyPlan.builder()
//                .planId(102L)
//                .product(healthProduct)
//                .planName("Health Gold")
//                .coverageAmount(50000.0)
//                .premiumAmount(2000.0)
//                .premiumType(PremiumType.ANNUAL)
//                .durationInYears(3)
//                .active(true)
//                .build();
//
//        policy = Policy.builder()
//                .policyId(50L)
//                .policyNumber("POL-123456")
//                .customer(customer)
//                .plan(healthPlan)
//                .startDate(LocalDate.now())
//                .endDate(LocalDate.now().plusYears(3))
//                .status(PolicyStatus.ACTIVE)
//                .totalPremiumPaid(2000.0)
//                .lastPaymentDate(LocalDate.now())
//                .nextPaymentDueDate(LocalDate.now().plusYears(1))
//                .build();
//    }
//
//    // ─── Policy Purchase Tests ───────────────────────────────────────────────
//
//    @Test
//    void testPurchaseNonLifePolicy_duplicate_throwsException() {
//        PurchasePolicyRequest request = new PurchasePolicyRequest();
//        request.setPlanId(102L);
//
//        when(customerRepository.findByUser_Id(1L)).thenReturn(Optional.of(customer));
//        when(planRepository.findById(102L)).thenReturn(Optional.of(healthPlan));
//
//        Policy activePolicy = Policy.builder()
//                .policyId(100L)
//                .plan(healthPlan)
//                .status(PolicyStatus.ACTIVE)
//                .build();
//
//        when(policyRepository.findByCustomerCustomerId(10L)).thenReturn(List.of(activePolicy));
//
//        assertThrows(BadRequestException.class, () -> policyService.purchasePolicy(request, 1L));
//    }
//
//    @Test
//    void testPurchaseLifePolicy_duplicate_succeeds() {
//        PurchasePolicyRequest request = new PurchasePolicyRequest();
//        request.setPlanId(101L);
//
//        when(customerRepository.findByUser_Id(1L)).thenReturn(Optional.of(customer));
//        when(planRepository.findById(101L)).thenReturn(Optional.of(lifePlan));
//
//        Policy activePolicy = Policy.builder()
//                .policyId(100L)
//                .plan(lifePlan)
//                .status(PolicyStatus.ACTIVE)
//                .build();
//
//        when(policyRepository.save(any(Policy.class))).thenAnswer(invocation -> invocation.getArgument(0));
//
//        PolicyResponse response = policyService.purchasePolicy(request, 1L);
//        assertNotNull(response);
//        assertEquals(PolicyStatus.PENDING_PAYMENT.name(), response.getStatus());
//        assertEquals(LocalDate.now(), response.getNextPaymentDueDate());
//    }
//
//    // ─── Premium Payment Tests ───────────────────────────────────────────────
//
//    @Test
//    void testMakePayment_invalidAmount_throwsException() {
//        PaymentRequest request = new PaymentRequest();
//        request.setPolicyId(50L);
//        request.setAmount(1000.0); // health plan premium is 2000.0
//        request.setPaymentMode(PaymentMethod.RAZORPAY);
//        request.setTransactionReference("REF123");
//        request.setPaymentStatus(PaymentStatus.SUCCESS);
//
//        when(policyRepository.findById(50L)).thenReturn(Optional.of(policy));
//        when(customerRepository.findByUser_Id(1L)).thenReturn(Optional.of(customer));
//
//        assertThrows(BadRequestException.class, () -> paymentService.makePayment(request, 1L, "CUSTOMER"));
//    }
//
//    @Test
//    void testMakePayment_alreadyFullyPaid_throwsException() {
//        PaymentRequest request = new PaymentRequest();
//        request.setPolicyId(50L);
//        request.setAmount(2000.0);
//        request.setPaymentMode(PaymentMethod.RAZORPAY);
//        request.setTransactionReference("REF123");
//        request.setPaymentStatus(PaymentStatus.SUCCESS);
//
//        policy.setNextPaymentDueDate(null); // indicates fully paid for active policy
//        when(policyRepository.findById(50L)).thenReturn(Optional.of(policy));
//        when(customerRepository.findByUser_Id(1L)).thenReturn(Optional.of(customer));
//
//        assertThrows(BadRequestException.class, () -> paymentService.makePayment(request, 1L, "CUSTOMER"));
//    }
//
//    @Test
//    void testMakePayment_annualAdvanceDueDate() {
//        PaymentRequest request = new PaymentRequest();
//        request.setPolicyId(50L);
//        request.setAmount(2000.0);
//        request.setPaymentMode(PaymentMethod.CREDIT_CARD);
//        request.setTransactionReference("REF123");
//        request.setPaymentStatus(PaymentStatus.SUCCESS);
//
//        policy.setStartDate(LocalDate.now().minusYears(1));
//        policy.setNextPaymentDueDate(LocalDate.now());
//        when(policyRepository.findById(50L)).thenReturn(Optional.of(policy));
//
//        // Mock payment history: 2 successful payments including this one
//        PremiumPayment p1 = PremiumPayment.builder().paymentStatus(PaymentStatus.SUCCESS).build();
//        PremiumPayment p2 = PremiumPayment.builder().paymentStatus(PaymentStatus.SUCCESS).build();
//        when(paymentRepository.findByPolicyPolicyId(50L)).thenReturn(List.of(p1, p2));
//
//        paymentService.makePayment(request, 1L, "ADMIN");
//
//        assertEquals(LocalDate.now(), policy.getLastPaymentDate());
//        assertEquals(policy.getStartDate().plusYears(2), policy.getNextPaymentDueDate());
//    }
//
//    @Test
//    void testAssignAgent_success() {
//        Claim claim = Claim.builder()
//                .claimId(200L)
//                .policy(policy)
//                .status(ClaimStatus.SUBMITTED)
//                .build();
//        User agent = User.builder().id(2L).role(Role.AGENT).fullName("Agent Bob").build();
//
//        when(claimRepository.findById(200L)).thenReturn(Optional.of(claim));
//        when(userRepository.findById(2L)).thenReturn(Optional.of(agent));
//        when(claimRepository.save(any(Claim.class))).thenAnswer(invocation -> invocation.getArgument(0));
//
//        ClaimResponse response = claimService.assignAgent(200L, 2L);
//
//        assertNotNull(response);
//        assertEquals(2L, response.getAssignedAgentId());
//        assertEquals("Agent Bob", response.getAssignedAgentName());
//    }
//
//    @Test
//    void testCreateProfile_nomineeMatchesSelf_throwsException() {
//        CustomerRequest request = new CustomerRequest();
//        request.setDateOfBirth(LocalDate.of(1990, 1, 1));
//        request.setAddress("Test Road");
//        request.setCity("Test City");
//        request.setState("Test State");
//        request.setPincode("110011");
//        request.setNomineeName("Test User"); // Matches customer user fullName
//        request.setNomineeRelation("Brother");
//
//        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
//
//        assertThrows(BadRequestException.class, () -> customerService.createProfile(request, 1L));
//    }
//
//    @Test
//    void testCreatePlan_premiumExceedsCoverage_throwsException() {
//        PolicyPlanRequest request = new PolicyPlanRequest();
//        request.setProductId(1L);
//        request.setPlanName("Overpriced Plan");
//        request.setCoverageAmount(5000.0);
//        request.setPremiumAmount(6000.0); // Premium higher than coverage amount
//        request.setPremiumType("ANNUAL");
//        request.setDurationInYears(5);
//        request.setTermsAndConditions("These are long terms and conditions of twenty chars.");
//
//        when(productRepository.findById(1L)).thenReturn(Optional.of(lifeProduct));
//
//        assertThrows(BadRequestException.class, () -> planService.createPlan(request));
//    }
//
//    @Test
//    void testCancelPolicy_withActiveClaims_throwsException() {
//        when(policyRepository.findById(50L)).thenReturn(Optional.of(policy));
//        // There is an active claim (status is not APPROVED/REJECTED)
//        when(claimRepository.existsByPolicyPolicyIdAndStatusNotIn(eq(50L), any())).thenReturn(true);
//
//        assertThrows(BadRequestException.class, () -> policyService.cancelPolicy(50L, 1L, "ADMIN"));
//    }
//
//    @Test
//    void testSubmitClaim_incidentDateBeforePolicyStartDate_throwsException() {
//        ClaimRequest request = new ClaimRequest();
//        request.setPolicyId(50L);
//        request.setClaimAmount(10000.0);
//        request.setClaimReason("Medical emergency hospitalisation");
//        request.setIncidentDate(policy.getStartDate().minusDays(5)); // Before policy start date
//        
//        List<ClaimDocumentRequest> docs = new ArrayList<>();
//        ClaimDocumentRequest doc = new ClaimDocumentRequest();
//        doc.setDocumentName("bill.pdf");
//        doc.setDocumentType("application/pdf");
//        doc.setDocumentUrl("http://example.com/discharge.pdf");
//        doc.setPublicId("id123");
//        docs.add(doc);
//        request.setDocuments(docs);
//
//        when(customerRepository.findByUser_Id(1L)).thenReturn(Optional.of(customer));
//        when(policyRepository.findById(50L)).thenReturn(Optional.of(policy));
//
//        assertThrows(BadRequestException.class, () -> claimService.submitClaim(request, 1L));
//    }
//
//    @Test
//    void testMakePayment_quarterlyAndMonthlyIncrements() {
//        // Quarterly
//        policy.getPlan().setPremiumType(PremiumType.QUARTERLY);
//        PaymentRequest request = new PaymentRequest();
//        request.setPolicyId(50L);
//        request.setAmount(2000.0);
//        request.setPaymentMode(PaymentMethod.CREDIT_CARD);
//        request.setTransactionReference("REF456");
//        request.setPaymentStatus(PaymentStatus.SUCCESS);
//
//        policy.setNextPaymentDueDate(LocalDate.now());
//        when(policyRepository.findById(50L)).thenReturn(Optional.of(policy));
//        
//        PremiumPayment p1 = PremiumPayment.builder().paymentStatus(PaymentStatus.SUCCESS).build();
//        when(paymentRepository.findByPolicyPolicyId(50L)).thenReturn(List.of(p1));
//
//        paymentService.makePayment(request, 1L, "ADMIN");
//        assertEquals(policy.getStartDate().plusMonths(3), policy.getNextPaymentDueDate());
//    }
//
//    @Test
//    void testMakePayment_beforeDueDate_throwsException() {
//        PaymentRequest request = new PaymentRequest();
//        request.setPolicyId(50L);
//        request.setAmount(2000.0);
//        request.setPaymentMode(PaymentMethod.CREDIT_CARD);
//        request.setTransactionReference("REF789");
//        request.setPaymentStatus(PaymentStatus.SUCCESS);
//
//        policy.setNextPaymentDueDate(LocalDate.now().plusDays(5));
//        when(policyRepository.findById(50L)).thenReturn(Optional.of(policy));
//
//        assertThrows(BadRequestException.class, () -> paymentService.makePayment(request, 1L, "ADMIN"));
//    }
//
//    @Test
//    void testMakePayment_cancelledPolicy_throwsException() {
//        PaymentRequest request = new PaymentRequest();
//        request.setPolicyId(50L);
//        request.setAmount(2000.0);
//        request.setPaymentMode(PaymentMethod.CREDIT_CARD);
//        request.setTransactionReference("REF789");
//        request.setPaymentStatus(PaymentStatus.SUCCESS);
//
//        policy.setStatus(PolicyStatus.CANCELLED);
//        when(policyRepository.findById(50L)).thenReturn(Optional.of(policy));
//
//        assertThrows(BadRequestException.class, () -> paymentService.makePayment(request, 1L, "ADMIN"));
//    }
//
//    @Test
//    void testMakePayment_expiredPolicy_throwsException() {
//        PaymentRequest request = new PaymentRequest();
//        request.setPolicyId(50L);
//        request.setAmount(2000.0);
//        request.setPaymentMode(PaymentMethod.CREDIT_CARD);
//        request.setTransactionReference("REF789");
//        request.setPaymentStatus(PaymentStatus.SUCCESS);
//
//        policy.setStatus(PolicyStatus.EXPIRED);
//        when(policyRepository.findById(50L)).thenReturn(Optional.of(policy));
//
//        assertThrows(BadRequestException.class, () -> paymentService.makePayment(request, 1L, "ADMIN"));
//    }
//
//    @Test
//    void testMakePayment_duplicateOneTimePayment_throwsException() {
//        // ONE_TIME plan
//        policy.getPlan().setPremiumType(PremiumType.ONE_TIME);
//        PaymentRequest request = new PaymentRequest();
//        request.setPolicyId(50L);
//        request.setAmount(2000.0);
//        request.setPaymentMode(PaymentMethod.CREDIT_CARD);
//        request.setTransactionReference("REF789");
//        request.setPaymentStatus(PaymentStatus.SUCCESS);
//
//        when(policyRepository.findById(50L)).thenReturn(Optional.of(policy));
//
//        PremiumPayment successfulPayment = PremiumPayment.builder()
//                .paymentStatus(PaymentStatus.SUCCESS)
//                .build();
//        when(paymentRepository.findByPolicyPolicyId(50L)).thenReturn(List.of(successfulPayment));
//
//        assertThrows(BadRequestException.class, () -> paymentService.makePayment(request, 1L, "ADMIN"));
//    }
//
//    @Test
//    void testMakePayment_lapsedPolicyReinstatesToActive() {
//        PaymentRequest request = new PaymentRequest();
//        request.setPolicyId(50L);
//        request.setAmount(2000.0);
//        request.setPaymentMode(PaymentMethod.CREDIT_CARD);
//        request.setTransactionReference("REF789");
//        request.setPaymentStatus(PaymentStatus.SUCCESS);
//
//        policy.setStatus(PolicyStatus.LAPSED);
//        policy.setNextPaymentDueDate(LocalDate.now().minusDays(10));
//        when(policyRepository.findById(50L)).thenReturn(Optional.of(policy));
//
//        PremiumPayment p1 = PremiumPayment.builder().paymentStatus(PaymentStatus.SUCCESS).build();
//        when(paymentRepository.findByPolicyPolicyId(50L)).thenReturn(List.of(p1));
//
//        paymentService.makePayment(request, 1L, "ADMIN");
//
//        assertEquals(PolicyStatus.ACTIVE, policy.getStatus());
//        assertEquals(LocalDate.now(), policy.getLastPaymentDate());
//    }
//}
