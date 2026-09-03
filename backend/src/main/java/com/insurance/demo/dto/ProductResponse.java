package com.insurance.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductResponse {

	private Long productId;

	private String productName;

	private String productType;

	private String description;

	private boolean active;
}