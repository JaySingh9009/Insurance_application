package com.insurance.demo.exception;

public class DuplicateEmailException extends RuntimeException {
	
	public DuplicateEmailException(String message) {
		
		super(message);
	}
}
