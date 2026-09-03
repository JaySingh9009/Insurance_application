package com.insurance.demo.serviceImpl;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.insurance.demo.dto.CustomerRequest;
import com.insurance.demo.dto.CustomerResponse;
import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.entity.Customer;
import com.insurance.demo.entity.User;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.repository.CustomerRepository;
import com.insurance.demo.repository.UserRepository;
import com.insurance.demo.service.CustomerService;
import com.insurance.demo.util.PaginationValidator;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerServiceImpl implements CustomerService {

    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("createdAt", "city", "state");

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional	
    public CustomerResponse createProfile(
            CustomerRequest request,
            Long userId) {

        log.info("Creating customer profile for userId={}", userId);

        User user = findUser(userId);

        if (customerRepository.findByUser_Id(userId).isPresent()) {
            throw new BadRequestException(
                    "Customer profile already exists for this account");
        }
        if (request.getNomineeName() != null && request.getNomineeName().equalsIgnoreCase(user.getFullName())) {
            throw new BadRequestException("Nominee name cannot be identical to the customer's own name");
        }

     if (request.getDateOfBirth() != null) {
         int age = Period.between(request.getDateOfBirth(), LocalDate.now()).getYears();
         if (age < 18) {
             throw new BadRequestException("Customer must be at least 18 years old to register");
         }
         if (age > 100) {
             throw new BadRequestException("Please enter a valid date of birth");
         }
     }

        Customer customer = Customer.builder()
                .user(user)
                .dateOfBirth(request.getDateOfBirth())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .nomineeName(request.getNomineeName())
                .nomineeRelation(request.getNomineeRelation())
                .build();

        customer = customerRepository.save(customer);

        log.info(
                "Customer profile created successfully. customerId={}",
                customer.getCustomerId());

        return mapToResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse updateProfile(
            CustomerRequest request,
            Long userId) {

        log.info("Updating customer profile for userId={}", userId);
        
 

     if (request.getDateOfBirth() != null) {
         int age = Period.between(request.getDateOfBirth(), LocalDate.now()).getYears();
         if (age < 18) {
             throw new BadRequestException("Customer must be at least 18 years old to register");
         }
         if (age > 100) {
             throw new BadRequestException("Please enter a valid date of birth");
         }
     }

        Customer customer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Customer profile not found"));

        if (request.getNomineeName() != null && request.getNomineeName().equalsIgnoreCase(customer.getUser().getFullName())) {
            throw new BadRequestException("Nominee name cannot be identical to the customer's own name");
        }

        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setAddress(request.getAddress());
        customer.setCity(request.getCity());
        customer.setState(request.getState());
        customer.setPincode(request.getPincode());
        customer.setNomineeName(request.getNomineeName());
        customer.setNomineeRelation(request.getNomineeRelation());

        customer = customerRepository.save(customer);

        return mapToResponse(customer);
    }

    @Override
    public CustomerResponse getMyProfile(Long userId) {

        Customer customer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Customer profile not found"));

        return mapToResponse(customer);
    }

    @Override
    public PagedResponse<CustomerResponse> getAllCustomers(
            int page,
            int size,
            String sortBy,
            String sortDir) {

        Pageable pageable = PaginationValidator.buildPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
        Page<Customer> customerPage = customerRepository.findAll(pageable);
        return PagedResponse.from(customerPage, this::mapToResponse);
    }



    private User findUser(Long userId) {

        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with ID: "
                                        + userId));
    }

    private CustomerResponse mapToResponse(Customer customer) {

        return CustomerResponse.builder()
                .customerId(customer.getCustomerId())
                .fullName(customer.getUser().getFullName())
                .email(customer.getUser().getEmail())
                .mobileNumber(customer.getUser().getMobileNumber())
                .dateOfBirth(customer.getDateOfBirth())
                .address(customer.getAddress())
                .city(customer.getCity())
                .state(customer.getState())
                .pincode(customer.getPincode())
                .nomineeName(customer.getNomineeName())
                .nomineeRelation(customer.getNomineeRelation())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }
}