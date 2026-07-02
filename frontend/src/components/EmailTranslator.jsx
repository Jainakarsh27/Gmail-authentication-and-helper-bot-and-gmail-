import React, { useState } from 'react';

const EmailTranslator = ({ emailContent }) => {
    const [explanation, setExplanation] = useState('');
    const [language, setLanguage] = useState('hindi');
    const [loading, setLoading] = useState(false);

    const handleTranslate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/translate/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: emailContent, language })
            });
            const data = await response.json();
            setExplanation(data.explanation);
        } catch (error) {
            console.error("Translation failed:", error);
        }
        setLoading(false);
    };

    const handleSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(explanation || emailContent);
        // Attempt to find a voice for the selected language
        const voices = window.speechSynthesis.getVoices();
        const langCode = {
            hindi: 'hi-IN',
            tamil: 'ta-IN',
            telugu: 'te-IN',
            malayalam: 'ml-IN'
        }[language] || 'en-US';

        utterance.lang = langCode;
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Language Context</h4>
                <div className="flex gap-2">
                    <select
                        className="input-premium py-1 px-3 text-sm"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{ padding: '4px 12px' }}
                    >
                        <option value="hindi">Hindi</option>
                        <option value="tamil">Tamil</option>
                        <option value="telugu">Telugu</option>
                        <option value="malayalam">Malayalam</option>
                    </select>
                    <button
                        className="btn-premium py-1 px-4 text-sm"
                        onClick={handleTranslate}
                        disabled={loading}
                        style={{ padding: '4px 16px' }}
                    >
                        {loading ? 'Translating...' : 'Explain'}
                    </button>
                </div>
            </div>

            {explanation && (
                <div className="p-4 rounded-xl bg-indigo-500/5 border-l-4 border-indigo-500 animate-fade-in">
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">{explanation}</p>
                    <button
                        className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        onClick={handleSpeak}
                    >
                        <span>🔊</span> Play Audio Explanation
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmailTranslator;
