package com.insurance.demo.service;


import com.insurance.demo.dto.CreateOfficerRequest;
import com.insurance.demo.dto.OfficerWorkloadResponse;
import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.UserResponse;
import com.insurance.demo.enums.Role;

import java.util.List;

public interface UserService {
   
    UserResponse createOfficer(CreateOfficerRequest request);
    PagedResponse<UserResponse> getAllUsers(int page, int size, String sortBy, String sortDir, Role role);
    UserResponse activateUser(Long id);
    UserResponse deactivateUser(Long id, Long requestingUserId);
    UserResponse getUserById(Long id);
    List<OfficerWorkloadResponse> getOfficersWithWorkload();
}