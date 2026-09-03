package com.insurance.demo.security;

import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private final StringRedisTemplate redisTemplate;

    public void blacklistToken(String token, long remainingTimeMs) {
        if (token != null && !token.isBlank() && remainingTimeMs > 0) {
            try {
                redisTemplate.opsForValue().set("blacklist:" + token, "true", remainingTimeMs, TimeUnit.MILLISECONDS);
                log.info("Token successfully blacklisted in Redis for {} ms", remainingTimeMs);
            } catch (Exception e) {
                log.error("Failed to store blacklisted token in Redis: {}", e.getMessage());
            }
        }
    }

    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + token));
        } catch (Exception e) {
            log.warn("Redis blacklist check failed ({}), allowing request fallback.", e.getMessage());
            return false;
        }
    }
}
