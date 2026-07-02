package com.mailsense.backend.controller;

import com.mailsense.backend.dto.EmailMessageDTO;
import com.mailsense.backend.model.User;
import com.mailsense.backend.repository.UserRepository;
import com.mailsense.backend.service.AlertEngine;
import com.mailsense.backend.service.EmailService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class AlertController {

    private final EmailService emailService;
    private final AlertEngine alertEngine;
    private final UserRepository userRepository;

    public AlertController(EmailService emailService, AlertEngine alertEngine, UserRepository userRepository) {
        this.emailService = emailService;
        this.alertEngine = alertEngine;
        this.userRepository = userRepository;
    }

    @GetMapping("/api/alerts/check")
    public List<EmailMessageDTO> checkAlerts(
            @RegisteredOAuth2AuthorizedClient("google") OAuth2AuthorizedClient authorizedClient,
            @AuthenticationPrincipal OAuth2User principal) throws Exception {
        
        if (principal == null) {
            return List.of();
        }
        String email = principal.getAttribute("email");
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return List.of();
        }

        List<EmailMessageDTO> emails = emailService.fetchRecentEmails(authorizedClient);
        return alertEngine.detectUrgentEmails(emails, user.getName(), user.getRegNo(), user.getCollegeEmail(), user.getNeoPatId());
    }
}

