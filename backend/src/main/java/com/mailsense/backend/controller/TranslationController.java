package com.mailsense.backend.controller;

import com.mailsense.backend.service.TranslationService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/translate")
public class TranslationController {

    private final TranslationService translationService;

    public TranslationController(TranslationService translationService) {
        this.translationService = translationService;
    }

    @PostMapping("/explain")
    public Map<String, String> explain(@RequestBody Map<String, String> request) {
        String text = request.get("text");
        String language = request.get("language");
        String explanation = translationService.translateAndExplain(text, language);
        return Map.of("explanation", explanation);
    }
}
