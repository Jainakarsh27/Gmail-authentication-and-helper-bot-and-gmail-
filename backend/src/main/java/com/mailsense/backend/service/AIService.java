package com.mailsense.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@Service
public class AIService {

    @Value("${openai.api.key:MOCK_KEY}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateEmail(String prompt, String tone) {
        if ("MOCK_KEY".equals(apiKey) || apiKey.trim().isEmpty() || "MOCK_KEY".equals(apiKey.trim())) {
            return "Subject: [AI Draft] Regarding " + prompt + "\n\nDear recipient,\n\nI am writing to address the matter regarding " + prompt + ".\n\nThank you for your consideration.\n\nSincerely,\n[Your Name]";
        }
        
        try {
            String systemPrompt = "You are a professional academic assistant. Write a well-formatted email based on the user's prompt. Tone: " + tone;
            return callLLM(systemPrompt, prompt);
        } catch (Exception e) {
            return "Error calling AI service: " + e.getMessage() + "\n\nFallback Draft:\nSubject: Regarding " + prompt + "\n\nDear Sir/Madam,\n\nI am writing to you regarding " + prompt + ".";
        }
    }

    public String correctGrammar(String text) {
        if ("MOCK_KEY".equals(apiKey) || apiKey.trim().isEmpty() || "MOCK_KEY".equals(apiKey.trim())) {
            return text + "\n\n[Grammar corrected by MailSense AI]";
        }
        
        try {
            String systemPrompt = "You are an English language editor. Correct any grammar mistakes, improve formatting, and optimize the clarity of the following email text. Do not add comments or introduction, return ONLY the corrected text.";
            return callLLM(systemPrompt, text);
        } catch (Exception e) {
            return text + " (Error correcting: " + e.getMessage() + ")";
        }
    }

    public String getExplanationAndTranslation(String text, String language) {
        if ("MOCK_KEY".equals(apiKey) || apiKey.trim().isEmpty() || "MOCK_KEY".equals(apiKey.trim())) {
            return null; // fallback to mock
        }
        try {
            String systemPrompt = "You are an academic translation assistant. Explain the following email in simple bullet points and translate the explanation to " + language + ". Keep the explanation simple so a student can immediately understand the key actions needed.";
            return callLLM(systemPrompt, text);
        } catch (Exception e) {
            return "Error translating email: " + e.getMessage();
        }
    }

    private String callLLM(String systemPrompt, String userPrompt) {
        String url = "https://api.openai.com/v1/chat/completions";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-3.5-turbo");
        body.put("messages", List.of(
            Map.of("role", "system", "content", systemPrompt),
            Map.of("role", "user", "content", userPrompt)
        ));
        body.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
        
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            @SuppressWarnings("unchecked")
            List<?> choices = (List<?>) response.getBody().get("choices");
            if (choices != null && !choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> choice = (Map<String, Object>) choices.get(0);
                @SuppressWarnings("unchecked")
                Map<String, Object> message = (Map<String, Object>) choice.get("message");
                if (message != null) {
                    return (String) message.get("content");
                }
            }
        }
        throw new RuntimeException("Empty or invalid response from OpenAI API");
    }
}
