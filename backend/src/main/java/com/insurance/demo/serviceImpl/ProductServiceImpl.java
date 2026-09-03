package com.insurance.demo.serviceImpl;

import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.insurance.demo.dto.PagedResponse;
import com.insurance.demo.dto.ProductRequest;
import com.insurance.demo.dto.ProductResponse;
import com.insurance.demo.entity.InsuranceProduct;
import com.insurance.demo.enums.ProductType;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.DuplicateResourceException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.repository.ProductRepository;
import com.insurance.demo.service.ProductService;
import com.insurance.demo.util.PaginationValidator;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("productName", "productType", "createdAt");

    private final ProductRepository productRepository;

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Creating insurance product: {}", request.getProductName());

        if (productRepository.existsByProductName(request.getProductName())) {
            log.warn("Product name already exists: {}", request.getProductName());
            throw new DuplicateResourceException("Product name already exists: " + request.getProductName());
        }

        ProductType type = parseProductType(request.getProductType());

        InsuranceProduct product = InsuranceProduct.builder()
                .productName(request.getProductName())
                .productType(type)
                .description(request.getDescription())
                .active(true)
                .build();

        product = productRepository.save(product);
        log.info("Product created: productId={}", product.getProductId());
        return mapToResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.info("Updating product: id={}", id);

        InsuranceProduct product = findProduct(id);

        // Check name uniqueness excluding current record
        if (productRepository.existsByProductNameAndProductIdNot(request.getProductName(), id)) {
            throw new DuplicateResourceException("Product name already exists: " + request.getProductName());
        }

        ProductType type = parseProductType(request.getProductType());

        product.setProductName(request.getProductName());
        product.setProductType(type);
        product.setDescription(request.getDescription());

        product = productRepository.save(product);
        log.info("Product updated: productId={}", product.getProductId());
        return mapToResponse(product);
    }

    @Override
    public ProductResponse getProductById(Long id) {
        return mapToResponse(findProduct(id));
    }

    @Override
    public PagedResponse<ProductResponse> getAllProducts(int page, int size, String sortBy, String sortDir) {
        Pageable pageable = PaginationValidator.buildPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
        Page<InsuranceProduct> productPage = productRepository.findAll(pageable);
        return PagedResponse.from(productPage, this::mapToResponse);
    }



    @Override
    public void deactivateProduct(Long id) {
        InsuranceProduct product = findProduct(id);
        product.setActive(false);
        productRepository.save(product);
        log.info("Product deactivated: productId={}", id);
    }

    @Override
    public void activateProduct(Long id) {
        InsuranceProduct product = findProduct(id);
        product.setActive(true);
        productRepository.save(product);
        log.info("Product activated: productId={}", id);
    }

    private InsuranceProduct findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
    }

    private ProductType parseProductType(String type) {
        try {
            return ProductType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid product type: " + type + ". Valid values: HEALTH, MOTOR, LIFE, TRAVEL");
        }
    }



    private ProductResponse mapToResponse(InsuranceProduct p) {
        return new ProductResponse(p.getProductId(), p.getProductName(),
                p.getProductType().name(), p.getDescription(), p.isActive());
    }
}