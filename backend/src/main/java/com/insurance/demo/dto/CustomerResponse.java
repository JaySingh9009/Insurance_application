package com.insurance.demo.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CustomerResponse {

    private Long customerId;

    private String fullName;
    private String email;
    private String mobileNumber;

    private LocalDate dateOfBirth;

    private String address;
    private String city;
    private String state;
    private String pincode;

    private String nomineeName;
    private String nomineeRelation;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}