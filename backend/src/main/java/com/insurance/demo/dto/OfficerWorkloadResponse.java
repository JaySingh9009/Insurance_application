package com.insurance.demo.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OfficerWorkloadResponse {
    private Long id;
    private String fullName;
    private String email;
    private String mobileNumber;
    private boolean active;
    private long activeTaskCount;
}
