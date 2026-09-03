package com.insurance.demo.enums;

import java.util.Set;

public enum DocumentCategory {

    IMAGE(Set.of("image/jpeg", "image/jpg", "image/png", "image/webp")),
    PDF(Set.of("application/pdf"));

    private final Set<String> allowedContentTypes;

    DocumentCategory(Set<String> allowedContentTypes) {
        this.allowedContentTypes = allowedContentTypes;
    }

    public Set<String> getAllowedContentTypes() {
        return allowedContentTypes;
    }

    public boolean isAllowed(String contentType) {
        if (contentType == null) return false;
        return allowedContentTypes.contains(contentType.toLowerCase());
    }
}