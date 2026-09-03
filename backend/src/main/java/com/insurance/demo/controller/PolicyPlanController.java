package com.insurance.demo.controller;

import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.PolicyPlanRequest;
import com.insurance.demo.dto.PolicyPlanResponse;
import com.insurance.demo.service.PolicyPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
@Tag(name = "Policy Plans", description = "Manage policy plans")
public class PolicyPlanController {

    private final PolicyPlanService planService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    @Operation(summary = "Create a policy plan (Admin only)")
    public ResponseEntity<PolicyPlanResponse> createPlan(@Valid @RequestBody PolicyPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planService.createPlan(request));
    }





    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    @Operation(summary = "Get all plans (Admin only)")
    public ResponseEntity<PagedResponse<PolicyPlanResponse>> getAllPlans(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "planName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(planService.getAllPlans(page, size, sortBy, sortDir));
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active plans with pagination")
    public ResponseEntity<PagedResponse<PolicyPlanResponse>> getActivePlans(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "planName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(planService.getActivePlans(page, size, sortBy, sortDir));
    }



    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a plan (Admin only)")
    public ResponseEntity<Void> deactivatePlan(@PathVariable Long id) {
        planService.deactivatePlan(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate a plan (Admin only)")
    public ResponseEntity<Void> activatePlan(@PathVariable Long id) {
        planService.activatePlan(id);
        return ResponseEntity.noContent().build();
    }
}