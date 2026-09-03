package com.insurance.demo.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Index;

/**
 * Forgot-password OTP records ko store karta hai.
 * Registration OTP se alag table — taaki dono flows independent rahein.
 */
@Entity
@Table(name = "password_reset_otps", indexes = {
    @Index(name = "idx_pwd_otp_user_used_created", columnList = "user_id, used, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 6)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime expiresAt;


    @Column(nullable = false)
    private boolean verified;


    @Column(nullable = false)
    private boolean used;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}