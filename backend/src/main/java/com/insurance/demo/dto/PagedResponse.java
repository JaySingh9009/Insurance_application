package com.insurance.demo.dto;

import lombok.*;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PagedResponse<T> {

    private List<T> records;
    private int currentPage;
    private int pageSize;
    private long totalRecords;
    private int totalPages;
    private boolean isLastPage;

    public static <E, D> PagedResponse<D> from(Page<E> page, Function<E, D> mapper) {
        List<D> records = page.getContent().stream().map(mapper).toList();
        return PagedResponse.<D>builder()
                .records(records)
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .totalRecords(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLastPage(page.isLast())
                .build();
    }

    public static <T> PagedResponse<T> from(Page<T> page) {
        return PagedResponse.<T>builder()
                .records(page.getContent())
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .totalRecords(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLastPage(page.isLast())
                .build();
    }
}

