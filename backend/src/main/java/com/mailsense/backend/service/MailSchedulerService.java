package com.mailsense.backend.service;

import com.mailsense.backend.model.PendingEmail;
import com.mailsense.backend.model.User;
import com.mailsense.backend.repository.PendingEmailRepository;
import com.mailsense.backend.repository.UserRepository;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MailSchedulerService {

    private final PendingEmailRepository pendingEmailRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final OAuth2AuthorizedClientService authorizedClientService;

    public MailSchedulerService(PendingEmailRepository pendingEmailRepository,
                                UserRepository userRepository,
                                EmailService emailService,
                                OAuth2AuthorizedClientService authorizedClientService) {
        this.pendingEmailRepository = pendingEmailRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.authorizedClientService = authorizedClientService;
    }

    @Scheduled(fixedDelay = 15000) // Poll every 15 seconds
    public void processPendingEmails() {
        LocalDateTime now = LocalDateTime.now();
        List<PendingEmail> pendingList = pendingEmailRepository.findByStatusAndSendAtBefore("PENDING", now);

        for (PendingEmail pending : pendingList) {
            try {
                User sender = userRepository.findByEmail(pending.getSenderEmail()).orElse(null);
                if (sender == null || sender.getGoogleSubId() == null) {
                    System.err.println("Skipping pending email ID " + pending.getId() + " - Sender not found or no googleSubId");
                    continue;
                }

                OAuth2AuthorizedClient authorizedClient = authorizedClientService.loadAuthorizedClient("google", sender.getGoogleSubId());
                if (authorizedClient == null) {
                    System.err.println("Skipping pending email ID " + pending.getId() + " - OAuth2 authorized client not found");
                    continue;
                }

                emailService.sendEmailViaGmail(authorizedClient, pending.getRecipientEmail(), pending.getSubject(), pending.getBody());
                
                pending.setStatus("SENT");
                pendingEmailRepository.save(pending);
                System.out.println("Successfully sent pending email ID " + pending.getId());
            } catch (Exception e) {
                System.err.println("Failed to send pending email ID " + pending.getId() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
}
