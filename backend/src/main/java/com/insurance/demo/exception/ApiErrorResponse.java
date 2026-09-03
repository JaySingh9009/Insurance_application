package com.insurance.demo.exception;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApiErrorResponse {

    private LocalDateTime timestamp;
    private int statusCode;
    private String errorType;
    private String message;
    private String path;
}