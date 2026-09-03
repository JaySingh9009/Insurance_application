package com.insurance.demo.service;

import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.ProductRequest;
import com.insurance.demo.dto.ProductResponse;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    ProductResponse getProductById(Long id);
    PagedResponse<ProductResponse> getAllProducts(int page, int size, String sortBy, String sortDir);

    void deactivateProduct(Long id);
    void activateProduct(Long id);
}