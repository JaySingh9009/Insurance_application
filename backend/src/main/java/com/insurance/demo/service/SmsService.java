package com.insurance.demo.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Slf4j
public class SmsService {

    @Value("${app.twilio.account-sid:}")
    private String accountSid;

    @Value("${app.twilio.auth-token:}")
    private String authToken;

    @Value("${app.twilio.from-phone:}")
    private String fromPhone;

    public void sendOtp(String toPhone, String otp) {
        if (!StringUtils.hasText(accountSid) || accountSid.startsWith("YOUR_")) {
            log.warn("[SMS LOG-ONLY MODE] OTP for {} is: {}", toPhone, otp);
            return;
        }
        try {
            Twilio.init(accountSid, authToken);
            Message.creator(
                    new PhoneNumber(toPhone),
                    new PhoneNumber(fromPhone),
                    "Your Insurance Portal OTP is: " + otp +
                    ". Valid for 5 minutes. Do not share with anyone."
            ).create();
            log.info("SMS OTP sent successfully to: {}", toPhone);
        } catch (Exception ex) {
            log.error("Failed to send SMS OTP to {}. Error: {}", toPhone, ex.getMessage());
            throw new IllegalStateException(
                    "Unable to send OTP via SMS. Error: " + ex.getMessage(), ex);
        }
    }
}