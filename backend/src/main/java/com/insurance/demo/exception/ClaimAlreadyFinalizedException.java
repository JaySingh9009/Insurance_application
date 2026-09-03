package com.insurance.demo.exception;

public class ClaimAlreadyFinalizedException extends RuntimeException {
	
	public ClaimAlreadyFinalizedException(String message) {
		super(message);
	}
}
