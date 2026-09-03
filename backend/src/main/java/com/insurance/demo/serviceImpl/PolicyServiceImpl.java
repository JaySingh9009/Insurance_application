package com.insurance.demo.serviceImpl;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.insurance.demo.dto.IssuePolicyRequest;
import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.PolicyResponse;
import com.insurance.demo.dto.PurchasePolicyRequest;
import com.insurance.demo.entity.Customer;
import com.insurance.demo.entity.Policy;
import com.insurance.demo.entity.PolicyPlan;
import com.insurance.demo.enums.PolicyStatus;
import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.enums.ProductType;
import com.insurance.demo.enums.Role;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.InvalidPolicyStatusException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.exception.UnauthorizedAccessException;
import com.insurance.demo.enums.ClaimStatus;
import com.insurance.demo.repository.ClaimRepository;
import com.insurance.demo.repository.CustomerRepository;
import com.insurance.demo.repository.PolicyPlanRepository;
import com.insurance.demo.repository.PolicyRepository;
import com.insurance.demo.service.PolicyService;
import com.insurance.demo.util.NumberGenerator;
import com.insurance.demo.util.PaginationValidator;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PolicyServiceImpl implements PolicyService {

	private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("createdAt", "status", "startDate", "endDate");
	private static final List<PolicyStatus> UNFINISHED_STATUSES = List.of(PolicyStatus.ACTIVE, PolicyStatus.PENDING_PAYMENT, PolicyStatus.LAPSED);

	private final PolicyRepository policyRepository;
	private final PolicyPlanRepository planRepository;
	private final CustomerRepository customerRepository;
	private final ClaimRepository claimRepository;

	@Override
	@Transactional
	public PolicyResponse purchasePolicy(PurchasePolicyRequest request, Long userId) {

		log.info("Customer userId={} purchasing policy for planId={}", userId, request.getPlanId());

		Customer customer = customerRepository.findByUser_Id(userId).orElseThrow(
				() -> new BadRequestException("You must create a customer profile before purchasing a policy"));

		PolicyPlan plan = findActivePlan(request.getPlanId());

		return processPolicyCreation(
				customer, plan, request.getStartDate(), request.getEndDate(),
				request.getSelectedPremiumType(), request.getPreExistingDiseases(),
				request.getVehicleRegistrationNo(), request.getVehicleMakeModel(), request.getVehicleYear(),
				request.getNomineeName(), request.getNomineeRelation()
		);
	}

	
//	-----------------------------------ISSUEPOLICY ON BEHALF OF CUSTOMER BY OFFICER---------------------------------

	@Override
	@Transactional
	public PolicyResponse issuePolicy(IssuePolicyRequest request) {

		log.info("Admin/Agent issuing policy for customerId={}, planId={}", request.getCustomerId(),
				request.getPlanId());

		Customer customer = customerRepository.findById(request.getCustomerId()).orElseThrow(
				() -> new ResourceNotFoundException("Customer not found with ID: " + request.getCustomerId()));

		PolicyPlan plan = findActivePlan(request.getPlanId());

		return processPolicyCreation(
				customer, plan, request.getStartDate(), request.getEndDate(),
				request.getSelectedPremiumType(), request.getPreExistingDiseases(),
				request.getVehicleRegistrationNo(), request.getVehicleMakeModel(), request.getVehicleYear(),
				request.getNomineeName(), request.getNomineeRelation()
		);
	}

	// ── Unified Core Policy Creation Engine ───────────────────────────────────

	private PolicyResponse processPolicyCreation(
			Customer customer,
			PolicyPlan plan,
			LocalDate reqStartDate,
			LocalDate reqEndDate,
			String reqSelectedType,
			List<String> reqDiseases,
			String reqRegNo,
			String reqMakeModel,
			Integer reqYear,
			String nomineeName,
			String nomineeRelation
	) {
		ProductType productType = plan.getProduct().getProductType();

		PolicyPreparedContext context = switch (productType) {
			case TRAVEL -> processTravelPolicyDetails(customer, plan, reqStartDate, reqEndDate);
			case MOTOR  -> processMotorPolicyDetails(customer, plan, reqStartDate, reqSelectedType, reqRegNo, reqMakeModel, reqYear);
			case HEALTH -> processHealthPolicyDetails(customer, plan, reqStartDate, reqSelectedType, reqDiseases);
			case LIFE   -> processLifePolicyDetails(customer, plan, reqStartDate, reqSelectedType);
		};

		Policy policy = buildPolicyEntity(
				customer, plan, context.selectedType(), context.startDate(), context.endDate(), context.installmentAmount(),
				context.vehicleRegNo(), context.vehicleMakeModel(), context.vehicleYear(), context.motorIdvAmount(), context.diseases(),
				nomineeName, nomineeRelation
		);

		policy = policyRepository.save(policy);

		log.info("Policy created successfully: policyId={}, policyNumber={}, productType={}, selectedType={}",
				policy.getPolicyId(), policy.getPolicyNumber(), productType, context.selectedType());

		return mapToResponse(policy);
	}

	// ── Product Specific Handlers ─────────────────────────────────────────────

	private record PolicyPreparedContext(
			LocalDate startDate,
			LocalDate endDate,
			PremiumType selectedType,
			double installmentAmount,
			List<String> diseases,
			String vehicleRegNo,
			String vehicleMakeModel,
			Integer vehicleYear,
			Double motorIdvAmount
	) {}

	private PolicyPreparedContext processTravelPolicyDetails(Customer customer, PolicyPlan plan, LocalDate reqStartDate, LocalDate reqEndDate) {
		if (reqStartDate == null || reqEndDate == null) {
			throw new BadRequestException("Travel policies require both a departure date (startDate) and a return date (endDate).");
		}
		if (reqStartDate.isBefore(LocalDate.now())) {
			throw new BadRequestException("Departure date cannot be in the past.");
		}
		if (!reqEndDate.isAfter(reqStartDate)) {
			throw new BadRequestException("Return date must be after the departure date.");
		}
		long tripDays = ChronoUnit.DAYS.between(reqStartDate, reqEndDate);
		if (tripDays > plan.getDuration()) {
			throw new BadRequestException("Trip duration of " + tripDays + " day(s) exceeds the maximum allowed " + plan.getDuration() + " day(s) for this plan.");
		}

		List<Policy> overlappingTravel = policyRepository.findOverlappingTravelPolicies(
				customer.getCustomerId(), reqStartDate, reqEndDate, UNFINISHED_STATUSES);
		if (!overlappingTravel.isEmpty()) {
			Policy existing = overlappingTravel.get(0);
			throw new BadRequestException("Customer already has an active or pending travel policy ("
					+ existing.getPolicyNumber() + ") covering trip dates from "
					+ existing.getStartDate() + " to " + existing.getEndDate()
					+ ". Overlapping travel insurance for the same dates is not allowed.");
		}

		double installment = calculateInstallment(plan.getPremiumAmount(), plan, PremiumType.ONE_TIME, 1.0);

		return new PolicyPreparedContext(reqStartDate, reqEndDate, PremiumType.ONE_TIME, installment, null, null, null, null, null);
	}

	private PolicyPreparedContext processMotorPolicyDetails(
			Customer customer, PolicyPlan plan, LocalDate reqStartDate,
			String reqSelectedType, String regNo, String makeModel, Integer year) {

		LocalDate startDate = (reqStartDate != null) ? reqStartDate : LocalDate.now();
		if (startDate.isBefore(LocalDate.now())) {
			throw new BadRequestException("Start date cannot be in the past");
		}
		LocalDate endDate = startDate.plusYears(plan.getDuration());
		PremiumType selectedType = parseSelectedPremiumType(reqSelectedType, plan.getPremiumType());

		MotorVehicleData motorData = validateAndBuildMotorData(regNo, makeModel, year, plan.getCoverageAmount());

		double installment = calculateInstallment(plan.getPremiumAmount(), plan, selectedType, 1.0);

		return new PolicyPreparedContext(startDate, endDate, selectedType, installment, null,
				motorData.regNo, motorData.makeModel, motorData.year, motorData.idvAmount);
	}

	private PolicyPreparedContext processHealthPolicyDetails(
			Customer customer, PolicyPlan plan, LocalDate reqStartDate,
			String reqSelectedType, List<String> reqDiseases) {

		LocalDate startDate = (reqStartDate != null) ? reqStartDate : LocalDate.now();
		if (startDate.isBefore(LocalDate.now())) {
			throw new BadRequestException("Start date cannot be in the past");
		}
		LocalDate endDate = startDate.plusYears(plan.getDuration());
		PremiumType selectedType = parseSelectedPremiumType(reqSelectedType, plan.getPremiumType());

		boolean hasDuplicate = policyRepository.existsByCustomerCustomerIdAndPlanProductProductTypeAndStatusIn(
				customer.getCustomerId(), ProductType.HEALTH, UNFINISHED_STATUSES);
		if (hasDuplicate) {
			throw new BadRequestException("Customer already has an active, pending, or lapsed policy for product type: HEALTH. Only multiple LIFE and MOTOR policies are allowed.");
		}

		List<String> diseases = null;
		double pedLoadingFactor = 1.0;
		if (reqDiseases != null && !reqDiseases.isEmpty()) {
			diseases = reqDiseases;
			pedLoadingFactor = calculatePedLoadingFactor(diseases);
		}

		double installment = calculateInstallment(plan.getPremiumAmount(), plan, selectedType, pedLoadingFactor);

		return new PolicyPreparedContext(startDate, endDate, selectedType, installment, diseases, null, null, null, null);
	}

	private PolicyPreparedContext processLifePolicyDetails(
			Customer customer, PolicyPlan plan, LocalDate reqStartDate, String reqSelectedType) {

		LocalDate startDate = (reqStartDate != null) ? reqStartDate : LocalDate.now();
		if (startDate.isBefore(LocalDate.now())) {
			throw new BadRequestException("Start date cannot be in the past");
		}
		LocalDate endDate = startDate.plusYears(plan.getDuration());
		PremiumType selectedType = parseSelectedPremiumType(reqSelectedType, plan.getPremiumType());

		boolean hasSameLifePlan = policyRepository.existsByCustomerCustomerIdAndPlanPlanIdAndStatusIn(
				customer.getCustomerId(), plan.getPlanId(), UNFINISHED_STATUSES);
		if (hasSameLifePlan) {
			throw new BadRequestException("Customer already holds an active or pending policy for the plan '"
					+ plan.getPlanName() + "'. You can purchase other Life Insurance plans, but cannot buy the exact same plan twice.");
		}

		double installment = calculateInstallment(plan.getPremiumAmount(), plan, selectedType, 1.0);

		return new PolicyPreparedContext(startDate, endDate, selectedType, installment, null, null, null, null, null);
	}

	private PremiumType parseSelectedPremiumType(String selectedTypeStr, PremiumType defaultType) {
		if (selectedTypeStr != null && !selectedTypeStr.isBlank()) {
			try {
				return PremiumType.valueOf(selectedTypeStr.toUpperCase());
			} catch (IllegalArgumentException ignored) {}
		}
		return defaultType;
	}
	

//  ---------------------------------------------CANCEL POLICY ONLY FOR ADMIN---------------------------------------------------

	@Override
	@Transactional
	public PolicyResponse cancelPolicy(Long policyId, Long requestingUserId, String role) {

		Policy policy = findPolicy(policyId);

		if (Role.CUSTOMER.name().equalsIgnoreCase(role)) {

			Customer customer = customerRepository
					.findByUser_Id(requestingUserId)
					.orElseThrow(() ->
							new ResourceNotFoundException(
									"Customer profile not found"));

			if (!policy.getCustomer()
					.getCustomerId()
					.equals(customer.getCustomerId())) {

				throw new UnauthorizedAccessException(
						"You are not authorized to cancel this policy");
			}
		}

		if (policy.getStatus() == PolicyStatus.CANCELLED) {
			throw new InvalidPolicyStatusException("Policy is already cancelled");
		}

		if (policy.getStatus() == PolicyStatus.EXPIRED) {
			throw new InvalidPolicyStatusException("Cannot cancel an expired policy");
		}

		// Enforce no open/unresolved claims exist
		boolean hasActiveClaims = claimRepository.existsByPolicyPolicyIdAndStatusNotIn(
				policyId, List.of(ClaimStatus.APPROVED, ClaimStatus.REJECTED));
		if (hasActiveClaims) {
			throw new BadRequestException("Cannot cancel a policy that has pending or unresolved claims");
		}

		policy.setStatus(PolicyStatus.CANCELLED);
		policyRepository.save(policy);

		log.info("Policy cancelled: policyId={}", policyId);

		return mapToResponse(policy);
	}
	
	

//	----------------------------------------------------METHYOD FOR GET POLICY BY ID-------------------------------------------

	@Override
	public PolicyResponse getPolicyById(Long policyId) {

		return mapToResponse(findPolicy(policyId));
	}
	
	
//	-----------------------------------------------------GET ALL POLICY IN PAGEABLE-----------------------------------------

	@Override
	public PagedResponse<PolicyResponse> getAllPolicies(int page, int size, String sortBy, String sortDir) {
		Pageable pageable = PaginationValidator.buildPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
		Page<Policy> policyPage = policyRepository.findAll(pageable);
		return PagedResponse.from(policyPage, this::mapToResponse);
	}
	
	
//	/-------------------------------------------GET MYPOLICIES FOR CUSTOMER---------------------------------------

	@Override
	public PagedResponse<PolicyResponse> getMyPolicies(Long userId, int page, int size, String sortBy, String sortDir) {
		Customer customer = customerRepository.findByUser_Id(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));

		Pageable pageable = PaginationValidator.buildPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
		Page<Policy> policyPage = policyRepository.findByCustomerCustomerId(customer.getCustomerId(), pageable);
		return PagedResponse.from(policyPage, this::mapToResponse);
	}
	
	
//	-------------------------------------------------FINDACTIVE PLAN ----------------------------------------------

	private PolicyPlan findActivePlan(Long planId) {

		PolicyPlan plan = planRepository.findById(planId)
				.orElseThrow(() -> new ResourceNotFoundException("Plan not found with ID: " + planId));

		if (!plan.isActive()) {
			throw new BadRequestException("The selected plan is not active and cannot be purchased");
		}

		return plan;
	}

//	---------------------------------------------FIND POLICY---------------------------------------------
	private Policy findPolicy(Long policyId) {

		return policyRepository.findById(policyId)
				.orElseThrow(() -> new ResourceNotFoundException("Policy not found with ID: " + policyId));
	}
	

	
	
	

	
//	---------------------------------------------CALCULATE INSTALLMENT -------------------------------------------

	/**
	 * Primary overload — accepts pedLoadingFactor (1.0 = no loading, 1.25 = +25%).
	 * Loading is applied ONLY for HEALTH policies; all others always pass 1.0.
	 * Returns whole-number installment (no decimals/paisa).
	 */
	private double calculateInstallment(Double totalAnnualPremium, PolicyPlan plan, PremiumType type, double pedLoadingFactor) {
		if (totalAnnualPremium == null) return 0.0;
		double loadedPremium = totalAnnualPremium * pedLoadingFactor;
		if (type == null) return (double) Math.round(loadedPremium);

		double result = switch (type) {
			case MONTHLY     -> loadedPremium / 12.0;
			case QUARTERLY   -> (loadedPremium * 0.985) / 4.0;  // 1.5% discount
			case SEMI_ANNUAL -> (loadedPremium * 0.97) / 2.0;   // 3.0% discount
			case ANNUAL      -> loadedPremium * 0.95;           // 5.0% discount
			case ONE_TIME    -> {
				if (plan != null && plan.getProduct() != null && plan.getProduct().getProductType() == ProductType.TRAVEL) {
					yield loadedPremium;
				}
				int duration = (plan != null && plan.getDuration() > 0) ? plan.getDuration() : 1;
				yield (loadedPremium * duration) * 0.90;         // 10% lump-sum discount
			}
		};

		return (double) Math.round(result);
	}



//	---------------------------------------------CALCULATE PED LOADING FACTOR -------------------------------------------

	/**
	 * Maps each declared pre-existing disease code to its loading % and returns
	 * a combined multiplier. Loadings are additive:
	 *   DIABETES(+15%) + HYPERTENSION(+10%)  =>  factor 1.25
	 * HEALTH ONLY — never called for LIFE / MOTOR / TRAVEL.
	 */
	private double calculatePedLoadingFactor(List<String> diseases) {
		if (diseases == null || diseases.isEmpty()) return 1.0;
		double totalLoading = 0.0;
		for (String disease : diseases) {
			switch (disease.toUpperCase().trim()) {
				case "DIABETES"      -> totalLoading += 0.15;
				case "HYPERTENSION"  -> totalLoading += 0.10;
				case "ASTHMA_COPD"   -> totalLoading += 0.10;
				case "THYROID"       -> totalLoading += 0.05;
				case "HEART_DISEASE" -> totalLoading += 0.30;
				case "KIDNEY_LIVER"  -> totalLoading += 0.25;
				case "OTHER"         -> totalLoading += 0.05;
				default              -> {} // unknown code — ignore
			}
		}
		return 1.0 + totalLoading;
	}
	
	

//	-----------------------------------------------CALCULATE IDV FOR MOTOR TYPE----------------------------------------------

	private double calculateIDV(double baseCoverage, int vehicleAge) {
		double factor;
		if (vehicleAge < 1)      factor = 0.95;
		else if (vehicleAge < 2) factor = 0.85;
		else if (vehicleAge < 3) factor = 0.80;
		else if (vehicleAge < 4) factor = 0.70;
		else if (vehicleAge < 5) factor = 0.60;
		else if (vehicleAge < 6) factor = 0.50;
		else                     factor = 0.40; // 6-15 years
		return Math.round(baseCoverage * factor * 100.0) / 100.0;
	}
	
//----------------------------------------------POLICY RESPONSE----------------------------------------------------
	private PolicyResponse mapToResponse(Policy p) {

		String selectedType = (p.getSelectedPremiumType() != null)
				? p.getSelectedPremiumType().name()
				: (p.getPlan().getPremiumType() != null ? p.getPlan().getPremiumType().name() : "ANNUAL");

		boolean isOneTimeOrTravel = (p.getPlan() != null && p.getPlan().getProduct() != null && p.getPlan().getProduct().getProductType() == ProductType.TRAVEL)
				|| p.getSelectedPremiumType() == PremiumType.ONE_TIME
				|| "ONE_TIME".equalsIgnoreCase(selectedType);

		// Installments are only applicable for recurring payment plans (MONTHLY, QUARTERLY, etc.).
		// For TRAVEL or ONE_TIME policies, installmentAmount is null so Jackson @JsonInclude(NON_NULL) hides it.
		Double instAmount = isOneTimeOrTravel
				? null
				: ((p.getInstallmentAmount() != null)
						? p.getInstallmentAmount()
						: calculateInstallment(p.getPlan().getPremiumAmount(), p.getPlan(), p.getSelectedPremiumType() != null ? p.getSelectedPremiumType() : p.getPlan().getPremiumType(), 1.0));

		String productName = (p.getPlan() != null && p.getPlan().getProduct() != null)
				? p.getPlan().getProduct().getProductName()
				: null;

		String productType = (p.getPlan() != null && p.getPlan().getProduct() != null)
				? p.getPlan().getProduct().getProductType().name()
				: null;

		Double coverageAmount = (p.getPlan() != null)
				? p.getPlan().getCoverageAmount()
				: null;

		String customerEmail = (p.getCustomer() != null && p.getCustomer().getUser() != null)
				? p.getCustomer().getUser().getEmail()
				: null;

		// Health-specific: disease list (null for non-HEALTH)
		List<String> diseaseList = (p.getPreExistingDiseases() != null && !p.getPreExistingDiseases().isEmpty())
				? p.getPreExistingDiseases()
				: null;

		return PolicyResponse.builder()
				.policyId(p.getPolicyId())
				.policyNumber(p.getPolicyNumber())
				.customerId(p.getCustomer().getCustomerId())
				.customerName(p.getCustomer().getUser().getFullName())
				.customerEmail(customerEmail)
				.productName(productName)
				.planId(p.getPlan().getPlanId())
				.planName(p.getPlan().getPlanName())
				.coverageAmount(coverageAmount)
				.premiumAmount(p.getPlan().getPremiumAmount())
				.selectedPremiumType(selectedType)
				.installmentAmount(instAmount)
				.startDate(p.getStartDate())
				.endDate(p.getEndDate())
				.status(p.getStatus().name())
				.totalPremiumPaid(p.getTotalPremiumPaid())
				.lastPaymentDate(p.getLastPaymentDate())
				.nextPaymentDueDate((isOneTimeOrTravel || p.getStatus() == PolicyStatus.PENDING_PAYMENT) ? null : p.getNextPaymentDueDate())
				.createdAt(p.getCreatedAt())
				// Product type for frontend detection
				.productType(productType)
				// Motor-specific fields (null for non-MOTOR policies)
				.vehicleRegistrationNo(p.getVehicleRegistrationNo())
				.vehicleMakeModel(p.getVehicleMakeModel())
				.vehicleYear(p.getVehicleYear())
				.idvAmount(p.getIdvAmount())
				// Health-specific fields (null for non-HEALTH policies)
				.preExistingDiseases(diseaseList)
				// Life-specific fields (null for non-LIFE policies)
				.nomineeName(p.getNomineeName())
				.nomineeRelation(p.getNomineeRelation())
				.build();
	}

	private record MotorVehicleData(String regNo, String makeModel, Integer year, Double idvAmount) {}

	private MotorVehicleData validateAndBuildMotorData(String regNo, String makeModel, Integer year, double baseCoverage) {
		if (regNo == null || regNo.isBlank() || makeModel == null || makeModel.isBlank() || year == null) {
			throw new BadRequestException("Vehicle registration number, make & model, and manufacturing year are required for Motor policies.");
		}
		String cleanedRegNo = regNo.replaceAll("[\\s-]", "").toUpperCase().trim();
		if (!cleanedRegNo.matches("^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$")) {
			throw new BadRequestException("Invalid vehicle registration number format: '" + regNo + "'. Expected format example: MH12AB1234");
		}

		boolean duplicateVehicle = policyRepository.existsByVehicleRegistrationNoAndStatusIn(
		        cleanedRegNo,
		        UNFINISHED_STATUSES
		);
		if (duplicateVehicle) {
			throw new BadRequestException("A policy already exists for vehicle registration number: " + cleanedRegNo);
		}

		int vehicleAge = LocalDate.now().getYear() - year;
		if (vehicleAge < 0 || year > LocalDate.now().getYear()) {
			throw new BadRequestException("Invalid vehicle manufacturing year: " + year);
		}
		if (vehicleAge > 15) {
			throw new BadRequestException(
					"Vehicle manufactured in " + year + " is " + vehicleAge
					+ " years old. Vehicles older than 15 years are not eligible for insurance on this platform.");
		}

		double idvAmount = calculateIDV(baseCoverage, vehicleAge);
		return new MotorVehicleData(
				cleanedRegNo,
				makeModel.trim(),
				year,
				idvAmount
		);
	}

	private Policy buildPolicyEntity(Customer customer, PolicyPlan plan, PremiumType selectedType,
									  LocalDate startDate, LocalDate endDate, double installmentAmount,
									  String motorVehicleRegNo, String motorVehicleMakeModel,
									  Integer motorVehicleYear, Double motorIdvAmount,
									  List<String> preExistingDiseases,
									  String nomineeName, String nomineeRelation) {
		ProductType productType = plan.getProduct().getProductType();
		boolean isOneTimeOrTravel = (productType == ProductType.TRAVEL || selectedType == PremiumType.ONE_TIME);

		List<String> diseases = (preExistingDiseases != null && !preExistingDiseases.isEmpty())
				? preExistingDiseases
				: new ArrayList<>();

		String resolvedNomineeName = null;
		String resolvedNomineeRelation = null;
		if (productType == ProductType.LIFE) {
			if (nomineeName != null && !nomineeName.isBlank()) {
				if (nomineeName.matches(".*\\d.*")) {
					throw new BadRequestException("Nominee name cannot contain numbers.");
				}
				resolvedNomineeName = nomineeName.trim();
			} else {
				resolvedNomineeName = (customer != null ? customer.getNomineeName() : null);
			}
			resolvedNomineeRelation = (nomineeRelation != null && !nomineeRelation.isBlank())
					? nomineeRelation.trim()
					: (customer != null ? customer.getNomineeRelation() : null);
		}

		return Policy.builder()
				.policyNumber(NumberGenerator.generatePolicyNumber())
				.customer(customer)
				.plan(plan)
				.selectedPremiumType(selectedType)
				.installmentAmount(installmentAmount)
				.startDate(startDate)
				.endDate(endDate)
				.status(PolicyStatus.PENDING_PAYMENT)
				.totalPremiumPaid(0.0)
				.nextPaymentDueDate(null)
				.vehicleRegistrationNo(motorVehicleRegNo)
				.vehicleMakeModel(motorVehicleMakeModel)
				.vehicleYear(motorVehicleYear)
				.idvAmount(motorIdvAmount)
				.preExistingDiseases(diseases)
				.nomineeName(resolvedNomineeName)
				.nomineeRelation(resolvedNomineeRelation)
				.build();
	}
}