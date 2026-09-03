package com.insurance.demo.dto;

import com.insurance.demo.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserResponse {

    private Long id;

    private String fullName;

    private String email;

    private String mobileNumber;

    private Role role;

    private boolean active;

    private long activeTaskCount;

    public UserResponse(Long id, String fullName, String email, String mobileNumber, Role role, boolean active) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.mobileNumber = mobileNumber;
        this.role = role;
        this.active = active;
        this.activeTaskCount = 0;
    }
}