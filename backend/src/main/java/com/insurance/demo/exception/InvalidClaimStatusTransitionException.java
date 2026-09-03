package com.insurance.demo.exception;

public class InvalidClaimStatusTransitionException extends RuntimeException {
    public InvalidClaimStatusTransitionException(String message) {
        super(message);
    }
}
