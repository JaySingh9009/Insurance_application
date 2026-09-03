package com.insurance.demo.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.insurance.demo.entity.User;
import com.insurance.demo.enums.Role;
import com.insurance.demo.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataInitializer
        implements CommandLineRunner {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args)
            throws Exception {

        
        if (!userRepository.existsByEmail(
                "admin@gmail.com")) {

            User admin =
                    User.builder()
                    .fullName("System Admin")
                    .email("admin@gmail.com")
                    .password(
                            passwordEncoder.encode(
                                    "admin123"))
                    .mobileNumber("9999999999")
                    .role(Role.ADMIN)
                    .active(true)
                    .build();

            userRepository.save(admin);
        }

     
        if (!userRepository.existsByEmail("officer@gmail.com") && !userRepository.existsByEmail("agent@gmail.com")) {
            User officer = User.builder()
                    .fullName("Insurance Officer")
                    .email("officer@gmail.com")
                    .password(passwordEncoder.encode("officer123"))
                    .mobileNumber("8888888888")
                    .role(Role.OFFICER)
                    .active(true)
                    .build();

            userRepository.save(officer);
        }
    }
}