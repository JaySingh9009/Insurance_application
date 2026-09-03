package com.insurance.demo.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClaimHistoryResponse {

    private Long historyId;
    private String previousStatus;
    private String newStatus;
    private String remarks;
    private String updatedBy;
    private LocalDateTime updatedAt;
}