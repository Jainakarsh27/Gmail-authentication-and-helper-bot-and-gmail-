package com.mailsense.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.net.URI;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import com.mailsense.backend.model.User;
import com.mailsense.backend.repository.UserRepository;

import java.util.Map;
import java.util.HashMap;

@RestController
public class AuthController {

    private final com.mailsense.backend.service.EmailService emailService;
    private final UserRepository userRepository;

    public AuthController(com.mailsense.backend.service.EmailService emailService, UserRepository userRepository) {
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    @GetMapping("/api/user")
    public Map<String, Object> user(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return null;
        }
        String email = principal.getAttribute("email");
        String googleId = principal.getName();
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .googleSubId(googleId)
                    .name(principal.getAttribute("name"))
                    .alarmPassword("STOP")
                    .build();
            return userRepository.save(newUser);
        });

        if (user.getGoogleSubId() == null || !user.getGoogleSubId().equals(googleId)) {
            user.setGoogleSubId(googleId);
            user = userRepository.save(user);
        }

        Map<String, Object> response = new HashMap<>(principal.getAttributes());
        response.put("dbUser", user);
        return response;
    }

    @GetMapping("/api/profile")
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String email = principal.getAttribute("email");
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    @PostMapping("/api/profile")
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal OAuth2User principal, @RequestBody User profileUpdate) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String email = principal.getAttribute("email");
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(profileUpdate.getName());
        user.setRegNo(profileUpdate.getRegNo());
        user.setCollegeEmail(profileUpdate.getCollegeEmail());
        user.setNeoPatId(profileUpdate.getNeoPatId());
        user.setAlarmPassword(profileUpdate.getAlarmPassword());

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @GetMapping("/api/emails")
    public java.util.List<com.mailsense.backend.dto.EmailMessageDTO> getEmails(@org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient("google") org.springframework.security.oauth2.client.OAuth2AuthorizedClient authorizedClient) throws Exception {
        return emailService.fetchRecentEmails(authorizedClient);
    }

    @GetMapping("/")
    public ResponseEntity<Void> root() {
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create("http://localhost:5173/"))
                .build();
    }

    @GetMapping("/api/home")
    public String home() {
        return "Welcome to MailSense AI! Please go to /login to authenticate.";
    }
}

