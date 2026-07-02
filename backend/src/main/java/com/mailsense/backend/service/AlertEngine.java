package com.mailsense.backend.service;

import com.mailsense.backend.dto.EmailMessageDTO;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlertEngine {

    private static final List<String> URGENT_KEYWORDS = Arrays.asList(
            "urgent", "exam", "deadline", "verification", "approval", "important", "immediate",
            "sessional", "submission", "schedule", "test", "placement", "hall ticket", "admit card",
            "fail", "arrear", "result", "grade", "hostel", "fee"
    );

    public List<EmailMessageDTO> detectUrgentEmails(List<EmailMessageDTO> emails, String studentName, String regNo, String collegeEmail, String neoPatId) {
        return emails.stream()
                .filter(email -> isUrgent(email, studentName, regNo, collegeEmail, neoPatId))
                .collect(Collectors.toList());
    }

    private boolean isUrgent(EmailMessageDTO email, String studentName, String regNo, String collegeEmail, String neoPatId) {
        String content = (email.getSubject() + " " + email.getBodySnippet()).toLowerCase();

        // 1. Check for urgent / academic keywords
        boolean hasKeyword = URGENT_KEYWORDS.stream().anyMatch(content::contains);

        // 2. Check for critical identifiers (Directly trigger alarm because these are highly specific)
        boolean hasSpecificId = false;
        if (regNo != null && !regNo.isEmpty() && content.contains(regNo.toLowerCase())) {
            hasSpecificId = true;
        }
        if (neoPatId != null && !neoPatId.isEmpty() && content.contains(neoPatId.toLowerCase())) {
            hasSpecificId = true;
        }

        // 3. Check for softer identifiers (Name, College Email)
        boolean hasSoftId = false;
        if (studentName != null && !studentName.isEmpty() && content.contains(studentName.toLowerCase())) {
            hasSoftId = true;
        }
        if (collegeEmail != null && !collegeEmail.isEmpty() && content.contains(collegeEmail.toLowerCase())) {
            hasSoftId = true;
        }

        // Trigger rules:
        // A) Directly matching Registration Number or NeoPat ID in the email.
        // B) Matching a soft identifier (Name or College Email) AND containing an urgent keyword.
        return hasSpecificId || (hasSoftId && hasKeyword);
    }
}
