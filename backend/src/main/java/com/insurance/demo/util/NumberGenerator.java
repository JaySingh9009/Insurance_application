package com.insurance.demo.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public class NumberGenerator {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private NumberGenerator() {}


    public static String generatePolicyNumber() {
        String datePart = LocalDate.now().format(DATE_FORMAT);
        String uniquePart = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "POL-" + datePart + "-" + uniquePart;
    }


    public static String generateClaimNumber() {
        String datePart = LocalDate.now().format(DATE_FORMAT);
        String uniquePart = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "CLM-" + datePart + "-" + uniquePart;
    }
}
