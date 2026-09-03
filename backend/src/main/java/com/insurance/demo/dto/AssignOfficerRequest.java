package com.insurance.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignOfficerRequest {

    @NotNull(message = "Officer ID is required")
    private Long officerId;
}
