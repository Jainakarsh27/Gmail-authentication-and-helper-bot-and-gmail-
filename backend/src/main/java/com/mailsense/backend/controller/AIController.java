package com.mailsense.backend.controller;

import com.mailsense.backend.service.AIService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/generate")
    public Map<String, String> generate(@RequestBody Map<String, String> request) {
        String prompt = request.get("prompt");
        String tone = request.get("tone");
        String draft = aiService.generateEmail(prompt, tone);
        return Map.of("draft", draft);
    }

    @PostMapping("/correct")
    public Map<String, String> correct(@RequestBody Map<String, String> request) {
        String text = request.get("text");
        String corrected = aiService.correctGrammar(text);
        return Map.of("corrected", corrected);
    }
}
