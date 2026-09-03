package com.insurance.demo.exception;

public class ResourceNotFoundException extends RuntimeException {

	public ResourceNotFoundException(String message) {

		super(message);
	}
}