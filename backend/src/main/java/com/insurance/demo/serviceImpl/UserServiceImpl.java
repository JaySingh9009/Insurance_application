package com.insurance.demo.serviceImpl;


import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.insurance.demo.dto.OfficerWorkloadResponse;
import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.UserResponse;
import com.insurance.demo.entity.User;
import com.insurance.demo.enums.Role;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.DuplicateEmailException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.repository.ClaimRepository;
import com.insurance.demo.repository.UserRepository;
import com.insurance.demo.service.UserService;
import com.insurance.demo.util.PaginationValidator;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("fullName", "email", "createdAt", "role");

    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;
    private final PasswordEncoder passwordEncoder;

   

    @Override
    public UserResponse createOfficer(com.insurance.demo.dto.CreateOfficerRequest request) {
        log.info("Admin creating insurance officer: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Officer creation failed - email exists: {}", request.getEmail());
            throw new DuplicateEmailException("Email already in use: " + request.getEmail());
        }

        User officer = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .mobileNumber(request.getMobileNumber())
                .role(Role.OFFICER)
                .active(true)
                .build();

        officer = userRepository.save(officer);
        log.info("Insurance officer created: userId={}", officer.getId());
        return mapToResponse(officer);
    }

    @Override
    public PagedResponse<UserResponse> getAllUsers(int page, int size, String sortBy, String sortDir, Role role) {
        Pageable pageable = PaginationValidator.buildPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
        Page<User> userPage = (role != null)
                ? userRepository.findByRole(role, pageable)
                : userRepository.findAll(pageable);
        return PagedResponse.from(userPage, this::mapToResponse);
    }

    @Override
    @Transactional
    public UserResponse activateUser(Long id) {
        User user = findUser(id);
        if (user.isActive()) {
            log.warn("User {} is already active", id);
        }
        user.setActive(true);
        userRepository.save(user);
        log.info("User {} activated", id);
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserResponse deactivateUser(Long id, Long requestingUserId) {
        if (id.equals(requestingUserId)) {
            throw new BadRequestException("You cannot deactivate your own account");
        }
        User user = findUser(id);
        user.setActive(false);
        userRepository.save(user);
        log.info("User {} deactivated by admin {}", id, requestingUserId);
        return mapToResponse(user);
    }

    @Override
    public UserResponse getUserById(Long id) {
        return mapToResponse(findUser(id));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
    }

    private static final Set<com.insurance.demo.enums.ClaimStatus> OFFICER_ACTIVE_STATUSES = Set.of(
            com.insurance.demo.enums.ClaimStatus.SUBMITTED,
            com.insurance.demo.enums.ClaimStatus.UNDER_REVIEW
    );

    private UserResponse mapToResponse(User u) {
        // activeTaskCount is no longer fetched here — use /officers-workload endpoint instead
        return UserResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .mobileNumber(u.getMobileNumber())
                .role(u.getRole())
                .active(u.isActive())
                .activeTaskCount(0)
                .build();
    }

    @Override
    public List<OfficerWorkloadResponse> getOfficersWithWorkload() {
        List<User> officers = userRepository.findByRoleAndActiveTrue(Role.OFFICER);
        log.info("Fetching workload for {} active officers", officers.size());
        return officers.stream()
                .map(o -> OfficerWorkloadResponse.builder()
                        .id(o.getId())
                        .fullName(o.getFullName())
                        .email(o.getEmail())
                        .mobileNumber(o.getMobileNumber())
                        .active(o.isActive())
                        .activeTaskCount(
                                claimRepository.countByAssignedOfficerIdAndStatusIn(o.getId(), OFFICER_ACTIVE_STATUSES)
                        )
                        .build())
                .toList();
    }
}