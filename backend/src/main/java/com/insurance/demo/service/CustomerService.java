package com.insurance.demo.service;

import com.insurance.demo.dto.CustomerRequest;
import com.insurance.demo.dto.CustomerResponse;
import com.insurance.demo.dto.PagedResponse;

public interface CustomerService {

    CustomerResponse createProfile(
            CustomerRequest request,
            Long userId);

    CustomerResponse updateProfile(
            CustomerRequest request,
            Long userId);

    CustomerResponse getMyProfile(
            Long userId);

    PagedResponse<CustomerResponse> getAllCustomers(
            int page,
            int size,
            String sortBy,
            String sortDir);


}