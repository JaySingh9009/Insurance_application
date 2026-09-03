package com.insurance.demo.exception;

public class InvalidPolicyStatusException extends RuntimeException {
    public InvalidPolicyStatusException(String message) {
        super(message);
    }
}
