package com.insurance.demo.entity;

import com.insurance.demo.enums.PremiumType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "policy_plans", uniqueConstraints = {
    @UniqueConstraint(name = "uk_product_plan_name", columnNames = {"product_id", "plan_name"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long planId;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private InsuranceProduct product;

    @Column(nullable = false)
    private String planName;

    @Column(nullable = false)
    private Double coverageAmount;

    @Column(nullable = false)
    private Double premiumAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PremiumType premiumType;

    @Column(name = "duration", nullable = false)
    private Integer duration;

    @Column(length = 2000)
    private String termsAndConditions;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}