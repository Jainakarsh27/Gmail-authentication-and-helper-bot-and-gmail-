package com.mailsense.backend.controller;

import com.mailsense.backend.model.PendingEmail;
import com.mailsense.backend.repository.PendingEmailRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emails")
public class EmailController {

    private final PendingEmailRepository pendingEmailRepository;

    public EmailController(PendingEmailRepository pendingEmailRepository) {
        this.pendingEmailRepository = pendingEmailRepository;
    }

    @PostMapping("/queue")
    public ResponseEntity<PendingEmail> queueEmail(@AuthenticationPrincipal OAuth2User principal, @RequestBody Map<String, String> request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String senderEmail = principal.getAttribute("email");
        String to = request.get("to");
        String subject = request.get("subject");
        String body = request.get("body");

        if (to == null || to.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        PendingEmail pendingEmail = PendingEmail.builder()
                .senderEmail(senderEmail)
                .recipientEmail(to)
                .subject(subject)
                .body(body)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .sendAt(LocalDateTime.now().plusMinutes(15)) // 15-minute buffer
                .build();

        PendingEmail saved = pendingEmailRepository.save(pendingEmail);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PendingEmail>> getPendingEmails(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String senderEmail = principal.getAttribute("email");
        List<PendingEmail> pendingList = pendingEmailRepository.findBySenderEmailAndStatusOrderByCreatedAtDesc(senderEmail, "PENDING");
        return ResponseEntity.ok(pendingList);
    }

    @PutMapping("/pending/{id}")
    public ResponseEntity<PendingEmail> editPendingEmail(@AuthenticationPrincipal OAuth2User principal, @PathVariable Long id, @RequestBody Map<String, String> request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String senderEmail = principal.getAttribute("email");
        PendingEmail pending = pendingEmailRepository.findById(id).orElse(null);
        if (pending == null) {
            return ResponseEntity.notFound().build();
        }
        if (!pending.getSenderEmail().equalsIgnoreCase(senderEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (!"PENDING".equals(pending.getStatus())) {
            return ResponseEntity.badRequest().body(null);
        }

        pending.setSubject(request.get("subject"));
        pending.setBody(request.get("body"));
        pending.setRecipientEmail(request.get("to"));

        PendingEmail updated = pendingEmailRepository.save(pending);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/pending/{id}")
    public ResponseEntity<Void> deletePendingEmail(@AuthenticationPrincipal OAuth2User principal, @PathVariable Long id) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String senderEmail = principal.getAttribute("email");
        PendingEmail pending = pendingEmailRepository.findById(id).orElse(null);
        if (pending == null) {
            return ResponseEntity.notFound().build();
        }
        if (!pending.getSenderEmail().equalsIgnoreCase(senderEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        pending.setStatus("CANCELLED");
        pendingEmailRepository.save(pending);
        return ResponseEntity.ok().build();
    }
}
