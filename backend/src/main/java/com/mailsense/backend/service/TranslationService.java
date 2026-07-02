package com.mailsense.backend.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.HashMap;

@Service
public class TranslationService {

    private final AIService aiService;
    private static final Map<String, String> MOCK_TRANSLATIONS = new HashMap<>();

    static {
        MOCK_TRANSLATIONS.put("hindi", "यह ईमेल आपके परीक्षा शुल्क के बारे में है। कृपया इसे जल्द ही जमा करें। (MailSense AI Mock)");
        MOCK_TRANSLATIONS.put("tamil", "இந்த மின்னஞ்சல் உங்கள் தேர்வுத் தொகையைப் பற்றியது. தயவுசெய்து விரைவில் சமர்ப்பிக்கவும். (MailSense AI Mock)");
        MOCK_TRANSLATIONS.put("telugu", "ఈ ఇమెయిల్ మీ పరీక్ష రుసుము గురించి. దయచేసి త్వరగా సమర్పించండి. (MailSense AI Mock)");
        MOCK_TRANSLATIONS.put("malayalam", "ഈ ഇമെയിൽ നിങ്ങളുടെ പരീക്ഷാ ഫീസിനെക്കുറിച്ചുള്ളതാണ്. ദയവായി അത് ഉടൻ സമർപ്പിക്കുക. (MailSense AI Mock)");
    }

    public TranslationService(AIService aiService) {
        this.aiService = aiService;
    }

    public String translateAndExplain(String text, String targetLanguage) {
        // Try calling the LLM translation & explanation first
        String explanation = aiService.getExplanationAndTranslation(text, targetLanguage);
        if (explanation != null) {
            return explanation;
        }

        // Fall back to Mock translations if LLM key is not configured
        return MOCK_TRANSLATIONS.getOrDefault(targetLanguage.toLowerCase(), 
            "Explanation in " + targetLanguage + ": Action is required regarding the email context. Please review and respond appropriately.");
    }
}
