
package com.insurance.demo.service;

import com.insurance.demo.enums.DocumentCategory;
import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {

    String[] uploadFile(MultipartFile file, String folder, DocumentCategory category);

    void deleteFile(String publicId);
}