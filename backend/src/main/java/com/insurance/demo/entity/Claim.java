package com.insurance.demo.entity;

import com.insurance.demo.enums.ClaimStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "claims", indexes = {
    @Index(name = "idx_claim_policy", columnList = "policy_id"),
    @Index(name = "idx_claim_officer_status", columnList = "assigned_officer_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long claimId;

    @Column(unique = true, nullable = false)
    private String claimNumber;

    @ManyToOne
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    @Column(nullable = false)
    private Double claimAmount;

    @Column(nullable = false, length = 1000)
    private String claimReason;

    @Column(nullable = false)
    private LocalDate incidentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClaimStatus status;

    private String officerRemarks;

    private String adminRemarks;

    // ── Motor-specific: claim category (null for non-MOTOR claims) ────────────
    @Column
    private String claimCategory;  // "ACCIDENT", "THEFT", "FIRE", "NATURAL_CALAMITY", "BREAKDOWN", "OTHER"

    @ManyToOne
    @JoinColumn(name = "assigned_officer_id")
    private User assignedOfficer;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}