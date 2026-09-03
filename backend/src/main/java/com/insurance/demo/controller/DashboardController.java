package com.insurance.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.AdminDashboardResponse;
import com.insurance.demo.service.DashboardService;

import lombok.RequiredArgsConstructor;

@RestController
    @RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<AdminDashboardResponse>
    getAdminDashboard(){

        return ResponseEntity.ok(
                dashboardService
                .getAdminDashboard());
    }
}