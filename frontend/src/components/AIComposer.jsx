import React, { useState } from 'react';

const AIComposer = ({ onQueueSuccess }) => {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [prompt, setPrompt] = useState('');
    const [draft, setDraft] = useState('');
    const [tone, setTone] = useState('formal');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) {
            alert("Please type a description of what you want to write about!");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, tone })
            });
            const data = await response.json();
            setDraft(data.draft);
            
            // Set subject automatically if not yet defined
            if (!subject) {
                setSubject("Regarding: " + prompt.substring(0, 30) + (prompt.length > 30 ? "..." : ""));
            }
        } catch (error) {
            console.error("AI Generation failed:", error);
        }
        setLoading(false);
    };

    const handleCorrect = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/ai/correct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: draft })
            });
            const data = await response.json();
            setDraft(data.corrected);
        } catch (error) {
            console.error("Grammar correction failed:", error);
        }
        setLoading(false);
    };

    const handleQueueSend = async () => {
        if (!to || !subject || !draft) {
            alert("Please fill in Recipient, Subject, and Draft Content!");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/api/emails/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, subject, body: draft })
            });
            if (response.ok) {
                alert("Email queued successfully! It will be sent in 15 minutes. You can edit/cancel it in your Outbox.");
                setTo('');
                setSubject('');
                setDraft('');
                setPrompt('');
                if (onQueueSuccess) {
                    onQueueSuccess();
                }
            } else {
                alert("Failed to queue email.");
            }
        } catch (error) {
            console.error("Queue email failed:", error);
        }
        setLoading(false);
    };

    return (
        <div className="glass-card p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                🤖 MailSense AI Compose
            </h3>
            
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-500 font-bold uppercase">To (Recipient Email)</label>
                    <input
                        className="input-premium"
                        placeholder="e.g. professor@college.edu"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-500 font-bold uppercase">Subject</label>
                    <input
                        className="input-premium"
                        placeholder="Enter email subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <label className="text-xs text-slate-500 font-bold uppercase">AI Prompt Description</label>
                <textarea
                    className="input-premium w-full"
                    placeholder="Describe what you want the email to be about (e.g. requesting extension for sessional exam due to fever)..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    style={{ minHeight: '100px' }}
                />
                <div className="flex justify-between items-center gap-4">
                    <select
                        className="input-premium"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        style={{ padding: '8px 16px' }}
                    >
                        <option value="formal">Formal</option>
                        <option value="semi-formal">Semi-Formal</option>
                        <option value="polite">Polite Request</option>
                    </select>
                    <button
                        className="btn-premium"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? 'Crafting...' : 'Generate AI Draft'}
                    </button>
                </div>
            </div>

            {draft && (
                <div className="mt-8 pt-8 border-t border-white/10 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Draft Result</h4>
                        <button
                            className="btn-premium !bg-indigo-600 hover:!bg-indigo-700 !text-white text-xs py-1 px-3"
                            onClick={handleQueueSend}
                            disabled={loading}
                            style={{ padding: '6px 12px' }}
                        >
                            🚀 Queue Send (15m delay)
                        </button>
                    </div>
                    <textarea
                        className="input-premium w-full font-mono text-sm mb-4"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={8}
                    />
                    <button
                        className="btn-premium w-full"
                        onClick={handleCorrect}
                        disabled={loading}
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
                    >
                        ✨ Polish Grammar & Tone
                    </button>
                </div>
            )}

            <style jsx>{`
                .mt-8 { margin-top: 2rem; }
                .pt-8 { padding-top: 2rem; }
                .border-t { border-top: 1px solid rgba(255,255,255,0.1); }
                .font-mono { font-family: monospace; }
                .tracking-widest { letter-spacing: 0.1em; }
            `}</style>
        </div>
    );
};

export default AIComposer;
