package com.insurance.demo.serviceImpl;

import com.insurance.demo.dto.*;
import com.insurance.demo.entity.*;
import com.insurance.demo.enums.ClaimStatus;
import com.insurance.demo.enums.PolicyStatus;
import com.insurance.demo.exception.*;
import com.insurance.demo.repository.*;
import com.insurance.demo.service.ClaimDocumentService;
import com.insurance.demo.service.ClaimService;
import com.insurance.demo.util.NumberGenerator;
import com.insurance.demo.util.PaginationValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClaimServiceImpl implements ClaimService {

	private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("createdAt", "status", "claimAmount", "incidentDate");

	private final ClaimRepository claimRepository;
	private final ClaimStatusHistoryRepository historyRepository;
	private final PolicyRepository policyRepository;
	private final CustomerRepository customerRepository;
	private final UserRepository userRepository;
	private final ClaimDocumentService claimDocumentService;

	@Override
	@Transactional
	public ClaimResponse submitClaim(ClaimRequest request, Long userId) {
		log.info("Submitting claim for policyId={} by userId={}", request.getPolicyId(), userId);

		// Extract customer from JWT — never from request
		Customer customer = customerRepository.findByUser_Id(userId)
				.orElseThrow(() -> new BadRequestException("You must have a customer profile to submit a claim"));

		Policy policy = policyRepository.findById(request.getPolicyId())
				.orElseThrow(() -> new ResourceNotFoundException("Policy not found with ID: " + request.getPolicyId()));

		// Policy must belong to this customer
		if (!policy.getCustomer().getCustomerId().equals(customer.getCustomerId())) {
			throw new UnauthorizedAccessException("You are not authorized to raise a claim on this policy");
		}

		// Auto-lapse check: check if past nextPaymentDueDate by > 30 days
		if (policy.getStatus() == PolicyStatus.ACTIVE && policy.getNextPaymentDueDate() != null) {
			if (LocalDate.now().isAfter(policy.getNextPaymentDueDate().plusDays(30))) {
				policy.setStatus(PolicyStatus.LAPSED);
				policyRepository.save(policy);
				log.info("Policy status automatically updated to LAPSED: policyId={}", policy.getPolicyId());
			}
		}

		// Policy must be ACTIVE
		if (policy.getStatus() != PolicyStatus.ACTIVE) {
			log.warn("Claim rejected - policy is not active: policyId={}, status={}", policy.getPolicyId(),
					policy.getStatus());
			throw new InvalidPolicyStatusException(
					"Claims can only be raised on ACTIVE policies. Policy status: " + policy.getStatus());
		}

		// Incident date validation against policy coverage period
		if (request.getIncidentDate().isBefore(policy.getStartDate())
				|| request.getIncidentDate().isAfter(policy.getEndDate())) {
			throw new BadRequestException("Incident date must fall within the policy coverage period ("
					+ policy.getStartDate() + " to " + policy.getEndDate() + ")");
		}

		// Incident date validation against initial activation/payment date
		if (policy.getLastPaymentDate() != null && request.getIncidentDate().isBefore(policy.getLastPaymentDate())) {
			throw new BadRequestException("Incident date cannot be prior to the policy payment/activation date");
		}

		// Incident date validation against future date
		if (request.getIncidentDate().isAfter(LocalDate.now())) {
			throw new BadRequestException("Incident date must not be a future date");
		}

		List<Claim> policyClaims = claimRepository.findByPolicyPolicyId(policy.getPolicyId());
		double totalPreviousClaimed = policyClaims.stream().filter(c -> c.getStatus() != ClaimStatus.REJECTED)
				.mapToDouble(Claim::getClaimAmount).sum();

		// Effective coverage limit: IDV amount for MOTOR policies (if present), else
		// plan coverage amount
		double maxCoverageLimit = (policy.getIdvAmount() != null && policy.getIdvAmount() > 0) ? policy.getIdvAmount()
				: policy.getPlan().getCoverageAmount();

		if (totalPreviousClaimed + request.getClaimAmount() > maxCoverageLimit) {
			double remainingCoverage = Math.max(0.0, maxCoverageLimit - totalPreviousClaimed);
			log.warn("Total claimed amount ({}) + new claim ({}) exceeds maximum policy limit ({})",
					totalPreviousClaimed, request.getClaimAmount(), maxCoverageLimit);
			throw new ClaimAmountExceededException(
					"Total claimed amount would exceed the policy limit. Remaining claimable limit: "
							+ remainingCoverage + " (Maximum Limit: " + maxCoverageLimit + ", Previously claimed: "
							+ totalPreviousClaimed + ")");
		}

		// Cannot raise a second active claim (enhancement per spec)
		boolean hasActiveClaim = claimRepository.existsByPolicyPolicyIdAndStatusNotIn(policy.getPolicyId(),
				List.of(ClaimStatus.APPROVED, ClaimStatus.REJECTED));
		if (hasActiveClaim) {
			log.warn("Duplicate active claim for policyId={}", policy.getPolicyId());
			throw new BadRequestException(
					"An active claim already exists for this policy. Wait for it to be resolved before submitting a new one.");
		}

		// At least one document must be submitted (validated by @Size(min=1) on DTO,
		// but double-check)
		if (request.getDocuments() == null || request.getDocuments().isEmpty()) {
			throw new BadRequestException("At least one claim document must be submitted");
		}

		Claim claim = Claim.builder().claimNumber(NumberGenerator.generateClaimNumber()).policy(policy)
				.claimAmount(request.getClaimAmount()).claimReason(request.getClaimReason())
				.incidentDate(request.getIncidentDate()).claimCategory(request.getClaimCategory())
				.status(ClaimStatus.SUBMITTED).build();

		claim = claimRepository.save(claim);
		final Claim savedClaim = claim;

		// Link the pre-uploaded Cloudinary documents (from Step 1) to this claim.
		// Documents already exist in Cloudinary — we just store the URLs in DB.
		claimDocumentService.linkDocumentsToClaim(savedClaim.getClaimId(), request.getDocuments());

		// Record initial status history
		saveHistory(savedClaim, null, ClaimStatus.SUBMITTED, "Claim submitted by customer", customer.getUser());

		log.info("Claim submitted: claimId={}, claimNumber={}", savedClaim.getClaimId(), savedClaim.getClaimNumber());
		return mapToResponse(savedClaim);
	}

	// ─── Insurance Officer Status Update
	// ───────────────────────────────────────────────────

	@Override
	@Transactional
	public ClaimResponse updateOfficerClaimStatus(Long claimId, OfficerRemarkRequest request, Long officerUserId) {
		log.info("Officer userId={} updating claimId={} to status={}", officerUserId, claimId,
				request.getTargetStatus());

		Claim claim = findClaim(claimId);
		User officer = findUser(officerUserId);

		if (claim.getAssignedOfficer() == null) {
			throw new BadRequestException(
					"This claim has not been assigned to any insurance officer yet. Only the assigned officer can review or recommend it.");
		}

		if (!claim.getAssignedOfficer().getId().equals(officerUserId)) {
			throw new UnauthorizedAccessException("Only the assigned insurance officer ("
					+ claim.getAssignedOfficer().getFullName() + ") can review or recommend it.");
		}

		ClaimStatus targetStatus = parseStatus(request.getTargetStatus());

		validateOfficerTransition(claim.getStatus(), targetStatus);

		ClaimStatus previousStatus = claim.getStatus();

		if (targetStatus == ClaimStatus.UNDER_REVIEW) {
			claim.setStatus(ClaimStatus.UNDER_REVIEW);
		} else if (targetStatus == ClaimStatus.RECOMMENDED_APPROVAL) {
			claim.setStatus(ClaimStatus.RECOMMENDED_APPROVAL);
			claim.setOfficerRemarks(request.getRemarks());
		} else if (targetStatus == ClaimStatus.RECOMMENDED_REJECTION) {
			claim.setStatus(ClaimStatus.RECOMMENDED_REJECTION);
			claim.setOfficerRemarks(request.getRemarks());
		}

		claimRepository.save(claim);
		saveHistory(claim, previousStatus, targetStatus, request.getRemarks(), officer);

		log.info("Claim {} updated from {} to {} by officer {}", claimId, previousStatus, targetStatus, officerUserId);
		return mapToResponse(claim);
	}

	@Override
	@Transactional
	public ClaimResponse makeClaimDecision(Long claimId, ClaimDecisionRequest request, Long adminUserId) {
		log.info("Admin userId={} making decision on claimId={}: {}", adminUserId, claimId, request.getDecision());

		Claim claim = findClaim(claimId);
		User admin = findUser(adminUserId);

		// Cannot change terminal statuses
		if (claim.getStatus() == ClaimStatus.APPROVED || claim.getStatus() == ClaimStatus.REJECTED) {
			throw new ClaimAlreadyFinalizedException("Claim is already finalized with status: " + claim.getStatus());
		}

		ClaimStatus decision = parseStatus(request.getDecision());
		validateAdminDecision(claim.getStatus(), decision);

		ClaimStatus previousStatus = claim.getStatus();
		claim.setStatus(decision);
		claim.setAdminRemarks(request.getAdminRemarks());

		claimRepository.save(claim);
		saveHistory(claim, previousStatus, decision, request.getAdminRemarks(), admin);

		log.info("Admin decision recorded: claimId={}, decision={}", claimId, decision);
		return mapToResponse(claim);
	}

	@Override
	public PagedResponse<ClaimResponse> getAllClaims(int page, int size, String sortBy, String sortDir) {
		Pageable pageable = PaginationValidator.buildPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
		Page<Claim> claimPage = claimRepository.findAll(pageable);
		return PagedResponse.from(claimPage, this::mapToResponse);
	}

	@Override
	public PagedResponse<ClaimResponse> getMyClaims(Long userId, int page, int size, String sortBy, String sortDir) {
		Customer customer = customerRepository.findByUser_Id(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));

		Pageable pageable = PaginationValidator.buildPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
		Page<Claim> claimPage = claimRepository.findByPolicyCustomerCustomerId(customer.getCustomerId(), pageable);
		return PagedResponse.from(claimPage, this::mapToResponse);
	}

	private void validateOfficerTransition(ClaimStatus current, ClaimStatus target) {
		boolean valid = false;
		if (current == ClaimStatus.SUBMITTED) {
			valid = (target == ClaimStatus.UNDER_REVIEW);
		} else if (current == ClaimStatus.UNDER_REVIEW) {
			valid = (target == ClaimStatus.RECOMMENDED_APPROVAL || target == ClaimStatus.RECOMMENDED_REJECTION);
		}
		if (!valid) {
			throw new InvalidClaimStatusTransitionException(
					"Insurance Officer cannot transition claim from " + current + " to " + target);
		}
	}

	/**
	 * Strictly enforced admin decisions: RECOMMENDED_APPROVAL → APPROVED | REJECTED
	 * RECOMMENDED_REJECTION → APPROVED | REJECTED
	 */
	private void validateAdminDecision(ClaimStatus current, ClaimStatus target) {
		boolean valid = false;
		if (current == ClaimStatus.RECOMMENDED_APPROVAL || current == ClaimStatus.RECOMMENDED_REJECTION) {
			valid = (target == ClaimStatus.APPROVED || target == ClaimStatus.REJECTED);
		}
		if (!valid) {
			throw new InvalidClaimStatusTransitionException("Admin cannot transition claim from " + current + " to "
					+ target + ". Claim must be in RECOMMENDED_APPROVAL or RECOMMENDED_REJECTION state first.");
		}
	}

	private void saveHistory(Claim claim, ClaimStatus previous, ClaimStatus next, String remarks, User updatedBy) {
		ClaimStatusHistory history = ClaimStatusHistory.builder().claim(claim).previousStatus(previous).newStatus(next)
				.remarks(remarks).updatedBy(updatedBy).build();
		historyRepository.save(history);
	}

	private Claim findClaim(Long claimId) {
		return claimRepository.findById(claimId)
				.orElseThrow(() -> new ResourceNotFoundException("Claim not found with ID: " + claimId));
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
	}

	private ClaimStatus parseStatus(String status) {
		try {
			return ClaimStatus.valueOf(status.toUpperCase());
		} catch (IllegalArgumentException e) {
			throw new BadRequestException("Invalid claim status: " + status);
		}
	}


	@Override
	@Transactional
	public ClaimResponse assignOfficer(Long claimId, Long officerId) {
		log.info("Admin assigning officerId={} to claimId={}", officerId, claimId);
		Claim claim = findClaim(claimId);
		User officer = findUser(officerId);

		if (officer.getRole() != com.insurance.demo.enums.Role.OFFICER) {
			throw new BadRequestException("User with ID " + officerId + " is not an Insurance Officer");
		}

		claim.setAssignedOfficer(officer);
		claimRepository.save(claim);

		// Record history
		saveHistory(claim, claim.getStatus(), claim.getStatus(),
				"Claim assigned to Insurance Officer: " + officer.getFullName(), null);

		log.info("Claim {} successfully assigned to officer {}", claimId, officerId);
		return mapToResponse(claim);
	}

	private static final Set<ClaimStatus> OFFICER_ACTIVE_STATUSES = Set.of(ClaimStatus.SUBMITTED,
			ClaimStatus.UNDER_REVIEW);

	private ClaimResponse mapToResponse(Claim c) {
		Long officerId = c.getAssignedOfficer() != null ? c.getAssignedOfficer().getId() : null;
		// activeTaskCount is no longer fetched here — use GET /api/admin/users/officers-workload
		// for officer workload data (used in Assign Officer dropdown)

		String remarks = c.getOfficerRemarks();
		String officerName = c.getAssignedOfficer() != null ? c.getAssignedOfficer().getFullName() : null;

		return ClaimResponse.builder().claimId(c.getClaimId()).claimNumber(c.getClaimNumber())
				.policyId(c.getPolicy().getPolicyId()).policyNumber(c.getPolicy().getPolicyNumber())
				.claimAmount(c.getClaimAmount()).claimReason(c.getClaimReason()).incidentDate(c.getIncidentDate())
				.status(c.getStatus().name()).officerRemarks(remarks).adminRemarks(c.getAdminRemarks())
				.customerName(c.getPolicy().getCustomer().getUser().getFullName()).assignedOfficerId(officerId)
				.assignedOfficerName(officerName).assignedOfficerActiveTaskCount(null)
				.claimCategory(c.getClaimCategory()).createdAt(c.getCreatedAt()).updatedAt(c.getUpdatedAt()).build();
	}
}