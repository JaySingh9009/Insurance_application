package com.insurance.demo.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {



    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return build(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", ex.getMessage(), request);
    }



    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicateEmail(
            DuplicateEmailException ex, HttpServletRequest request) {
        log.warn("Duplicate email: {}", ex.getMessage());
        return build(HttpStatus.CONFLICT, "DUPLICATE_EMAIL", ex.getMessage(), request);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicateResource(
            DuplicateResourceException ex, HttpServletRequest request) {
        log.warn("Duplicate resource: {}", ex.getMessage());
        return build(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE", ex.getMessage(), request);
    }



    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException ex, HttpServletRequest request) {
        log.warn("Invalid credentials: {}", ex.getMessage());
        return build(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", ex.getMessage(), request);
    }

    @ExceptionHandler(InactiveUserException.class)
    public ResponseEntity<ApiErrorResponse> handleInactiveUser(
            InactiveUserException ex, HttpServletRequest request) {
        log.warn("Inactive user login attempt: {}", ex.getMessage());
        return build(HttpStatus.UNAUTHORIZED, "INACTIVE_USER", ex.getMessage(), request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(
            AuthenticationException ex, HttpServletRequest request) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return build(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", ex.getMessage(), request);
    }

    // ─── 403 ───────────────────────────────────────────────────────────────────

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ApiErrorResponse> handleUnauthorizedAccess(
            UnauthorizedAccessException ex, HttpServletRequest request) {
        log.warn("Unauthorized access: {}", ex.getMessage());
        return build(HttpStatus.FORBIDDEN, "FORBIDDEN", ex.getMessage(), request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied: {}", ex.getMessage());
        return build(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You do not have permission to access this resource", request);
    }



    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequest(
            BadRequestException ex, HttpServletRequest request) {
        log.warn("Bad request: {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), request);
    }

    @ExceptionHandler(PaymentGatewayException.class)
    public ResponseEntity<ApiErrorResponse> handlePaymentGateway(
            PaymentGatewayException ex, HttpServletRequest request) {
        log.error("Payment gateway error: {}", ex.getMessage());
        return build(HttpStatus.BAD_GATEWAY, "PAYMENT_GATEWAY_ERROR", ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidPolicyStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidPolicyStatus(
            InvalidPolicyStatusException ex, HttpServletRequest request) {
        log.warn("Invalid policy status: {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, "INVALID_POLICY_STATUS", ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidClaimStatusTransitionException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidClaimTransition(
            InvalidClaimStatusTransitionException ex, HttpServletRequest request) {
        log.warn("Invalid claim status transition: {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, "INVALID_CLAIM_STATUS_TRANSITION", ex.getMessage(), request);
    }

    @ExceptionHandler(ClaimAmountExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleClaimAmountExceeded(
            ClaimAmountExceededException ex, HttpServletRequest request) {
        log.warn("Claim amount exceeded coverage: {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, "CLAIM_AMOUNT_EXCEEDED", ex.getMessage(), request);
    }

    @ExceptionHandler(ClaimAlreadyFinalizedException.class)
    public ResponseEntity<ApiErrorResponse> handleClaimAlreadyFinalized(
            ClaimAlreadyFinalizedException ex, HttpServletRequest request) {
        log.warn("Claim already finalized: {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, "CLAIM_ALREADY_FINALIZED", ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidPaginationException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidPagination(
            InvalidPaginationException ex, HttpServletRequest request) {
        log.warn("Invalid pagination params: {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, "INVALID_PAGINATION", ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidSortFieldException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidSortField(
            InvalidSortFieldException ex, HttpServletRequest request) {
        log.warn("Invalid sort field: {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, "INVALID_SORT_FIELD", ex.getMessage(), request);
    }

    /**
     * Bean Validation (@Valid) — returns field-level error map
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        log.warn("Validation failed: {}", ex.getMessage());
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("statusCode", 400);
        body.put("errorType", "VALIDATION_FAILED");
        body.put("path", request.getRequestURI());
        body.put("errors", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }



    @ExceptionHandler(org.springframework.dao.DataAccessException.class)
    public ResponseEntity<ApiErrorResponse> handleDatabaseError(
            org.springframework.dao.DataAccessException ex, HttpServletRequest request) {
        log.error("Database error at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        String causeMsg = ex.getRootCause() != null ? ex.getRootCause().getMessage() : ex.getMessage();
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "DATABASE_ERROR",
                "Database error: " + causeMsg, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneral(
            Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "An unexpected error occurred. Please try again later.";
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", msg, request);
    }



    private ResponseEntity<ApiErrorResponse> build(
            HttpStatus status, String errorType, String message, HttpServletRequest request) {
        ApiErrorResponse body = ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .statusCode(status.value())
                .errorType(errorType)
                .message(message)
                .path(request.getRequestURI())
                .build();
        return ResponseEntity.status(status).body(body);
    }
}