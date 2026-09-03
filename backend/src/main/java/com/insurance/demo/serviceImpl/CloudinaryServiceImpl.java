

package com.insurance.demo.serviceImpl;

import com.cloudinary.Cloudinary;
import com.insurance.demo.enums.DocumentCategory;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    @Override
    public String[] uploadFile(MultipartFile file, String folder, DocumentCategory category) {
        validateFile(file, category);

        try {
            String publicId = folder + "/" + UUID.randomUUID();

            // PDF ke liye raw, images ke liye image resource type
            String resourceType = (category == DocumentCategory.PDF) ? "raw" : "image";

            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of(
                            "public_id", publicId,
                            "resource_type", resourceType
                    )
            );

            String secureUrl = (String) result.get("secure_url");
            String returnedPublicId = (String) result.get("public_id");

            // PDF ho to Google Docs viewer mein wrap karo
            String finalUrl = wrapWithGoogleDocsViewer(secureUrl, category);

            log.info("File uploaded: publicId={}, url={}", returnedPublicId, finalUrl);
            return new String[]{finalUrl, returnedPublicId};

        } catch (IOException e) {
            log.error("Cloudinary upload failed: {}", e.getMessage());
            throw new BadRequestException("Failed to upload file: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, Map.of("resource_type", "image"));
            log.info("File deleted from Cloudinary: publicId={}", publicId);
        } catch (IOException e) {
            log.warn("Failed to delete file (publicId={}): {}", publicId, e.getMessage());
        }
    }

    private String wrapWithGoogleDocsViewer(String cloudinaryUrl, DocumentCategory category) {
        if (category == DocumentCategory.PDF) {
            // Cloudinary PDF URLs mein image/upload hota hai — raw/upload se replace karo
            String rawUrl = cloudinaryUrl.replace("/image/upload/", "/raw/upload/");
            return "https://docs.google.com/viewer?url=" + rawUrl + "&embedded=true";
        }
        return cloudinaryUrl; // images as-is return karo
    }

    private void validateFile(MultipartFile file, DocumentCategory category) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("File size exceeds 10 MB limit. Actual size: "
                    + (file.getSize() / 1024 / 1024) + " MB");
        }
        String contentType = file.getContentType();
        if (!category.isAllowed(contentType)) {
            throw new BadRequestException(
                    "Invalid file type: " + contentType +
                    ". Allowed for " + category.name() + ": " + category.getAllowedContentTypes()
            );
        }
    }
}

