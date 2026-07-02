import React, { useState, useEffect, useRef } from 'react';
import { playAlarmSound, ALARM_TONES } from '../services/AlarmService';
import syncMobileAppImg from '../synchronized_mobile_app.png';

const mockPendingEmails = [
    {
        id: 'mock_pending_1',
        recipientEmail: 'professor@college.edu',
        subject: 'Requesting Extension for Course Registration files',
        body: 'Dear Professor,\n\nI am writing to request a brief extension for submitting the course registration files. I am currently waiting for verification from the registry office.\n\nThank you for your consideration,\n[Student Name]',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        sendAt: new Date(Date.now() + 12 * 60 * 1000 + 45 * 1000).toISOString() // 12m 45s remaining
    }
];

const Dashboard = ({ onLogout }) => {
    // --- State Variables ---
    const [emails, setEmails] = useState([]);
    const [urgentEmails, setUrgentEmails] = useState([]);
    const [pendingEmails, setPendingEmails] = useState(mockPendingEmails);
    const [profile, setProfile] = useState({ name: '', regNo: '', collegeEmail: '', neoPatId: '', alarmPassword: 'STOP' });
    const [loading, setLoading] = useState(false);
    
    // UI Navigation State
    const [activeFolder, setActiveFolder] = useState('inbox'); // 'inbox', 'priority', 'drafts', 'sent'
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Dialog/Modal States
    const [composeOpen, setComposeOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [silenceOpen, setSilenceOpen] = useState(false);
    const [silencePasswordInput, setSilencePasswordInput] = useState('');
    const [silenceError, setSilenceError] = useState('');
    
    // Compose Form States
    const [composeTo, setComposeTo] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [composePrompt, setComposePrompt] = useState('');
    const [composeTone, setComposeTone] = useState('formal');
    const [composeLoading, setComposeLoading] = useState(false);

    // Editing Outbox Draft States
    const [editingMail, setEditingMail] = useState(null);
    const [editTo, setEditTo] = useState('');
    const [editSubject, setEditSubject] = useState('');
    const [editBody, setEditBody] = useState('');

    // Active Alarm Tone
    const [alarmTone, setAlarmTone] = useState(ALARM_TONES.emergency);
    
    // Translate & Speak Tool States
    const [translateLang, setTranslateLang] = useState('hindi');
    const [translatedText, setTranslatedText] = useState('');
    const [translateLoading, setTranslateLoading] = useState(false);
    const [speakLangVoice, setSpeakLangVoice] = useState('hindi');

    // Grammar Checker States
    const [grammarErrors, setGrammarErrors] = useState([]);
    const [grammarLoading, setGrammarLoading] = useState(false);

    // GPT Assistant States
    const [gptPrompt, setGptPrompt] = useState('');
    const [gptActiveOption, setGptActiveOption] = useState('Draft Reply: Acknowledge & Confirm');
    const [gptLoading, setGptLoading] = useState(false);

    // Clock state for outbox countdowns
    const [now, setNow] = useState(new Date());

    // Audio Ref
    const audioRef = useRef(null);

    // --- High-Fidelity Mock Emails Matching the Screenshot ---
    const mockEmails = [
        {
            id: 'mock_1',
            from: 'Prathralin S',
            subject: '[URGENT] Registration #123456 Update - ACTION REQUIRED .lond to m...',
            bodySnippet: 'Hello, Please note that you have an urgent registration update pending for your course assignment. Immediate action is required to verify details.',
            internalDate: new Date(Date.now() - 5 * 60000).getTime(), // 5 mins ago
            isUrgent: true,
            body: 'Hello,\n\nPlease note that you have an urgent registration update pending for your course assignment. Immediate action is required to verify your details and complete the registry.\n\nBest regards,\nRegistration Team'
        },
        {
            id: 'mock_2',
            from: 'Prof. Sharma',
            subject: '[URGENT] Registration #123456 Update - Please stonus be added to fil...',
            bodySnippet: 'Dear student, please make sure your registration documents are submitted immediately. This needs to be added to your profile files.',
            internalDate: Date.now(), // now
            isUrgent: false,
            body: 'Dear student,\n\nPlease make sure your registration documents are submitted immediately. This needs to be added to your profile files. Let me know if you face any issues.\n\nSincerely,\nProf. Sharma'
        },
        {
            id: 'mock_3',
            from: 'Prof. Sharma',
            subject: '[URGENT] Registration #123456 Update - Please stonus be added to fil...',
            bodySnippet: 'Hello, Please check your course registration files. Urgent registration action is required to verify your enrollment. Immediate response is requested.',
            internalDate: new Date(Date.now() - 3 * 3600000).getTime(), // 3 hours ago
            isUrgent: true,
            body: 'Hello,\n\nPlease check your course registration files. Urgent registration action is required to verify your enrollment. Immediate response is requested, failing which registry might be suspended.\n\nBest regards,\nOffice of Registrar'
        },
        {
            id: 'mock_4',
            from: 'Prof. Sharma',
            subject: '[URGENT] Registration #123456 Update - ACTION REQUIRED',
            bodySnippet: 'Hello, Thank you for alsoaticward for [URGENT] Registration #123456 Update - ACTION REQUIRED.',
            internalDate: new Date(Date.now() - 8 * 3600000).getTime(), // 8 hours ago
            isUrgent: false,
            body: 'Hello,\n\nThank you for alsoaticward for [URGENT] Registration #123456 Update - ACTION REQUIRED. Please submit the files by tomorrow morning.'
        },
        {
            id: 'mock_5',
            from: 'Prof. Sharma',
            subject: '[URGENT] Registration #123456 Update - ACTION REQUIRED. There is...',
            bodySnippet: 'Hello, there is a registration issue that requires your immediate attention. Please check the attachment and verify.',
            internalDate: new Date(Date.now() - 10 * 3600000).getTime(),
            isUrgent: false,
            body: 'Hello,\n\nThere is a registration issue that requires your immediate attention. Please check the attachment and verify. Ensure registry details match your registrar records.'
        },
        {
            id: 'mock_6',
            from: 'Prof. Sharma',
            subject: '[URGENT] Registration #123456 Update - ACTION REQUIRED. There is...',
            bodySnippet: 'Dear student, action is required for your academic registration status. Please verify your details.',
            internalDate: new Date(Date.now() - 14 * 3600000).getTime(),
            isUrgent: false,
            body: 'Dear student,\n\nAction is required for your academic registration status. Please verify your details by logging into the student portal.'
        },
        {
            id: 'mock_7',
            from: 'Prof. Sharma',
            subject: '[URGENT] Registration #123456 Update - ACTION REQUIRED. There is...',
            bodySnippet: 'This is a reminder regarding the academic registration update. Please read the instructions below.',
            internalDate: new Date(Date.now() - 24 * 3600000).getTime(),
            isUrgent: false,
            body: 'This is a reminder regarding the academic registration update. Please read the instructions carefully.'
        },
        {
            id: 'mock_8',
            from: 'Prof. Sharma',
            subject: '[URGENT] Registration #123456 Update - ACTION REQUIRED',
            bodySnippet: 'Immediate response required for the course registration files. Please verify.',
            internalDate: new Date(Date.now() - 25 * 3600000).getTime(),
            isUrgent: false,
            body: 'Immediate response required for the course registration files. Please verify and submit.'
        },
        {
            id: 'mock_9',
            from: 'Johnman',
            subject: 'Prof. Sharma [URGENT] Registration #123456 Upd...',
            bodySnippet: 'Forwarded message from Prof. Sharma regarding registration update status.',
            internalDate: new Date(Date.now() - 26 * 3600000).getTime(),
            isUrgent: false,
            body: '---------- Forwarded message ---------\nFrom: Prof. Sharma\nSubject: [URGENT] Registration #123456 Update\n\nForwarded message from Prof. Sharma regarding registration update status.'
        }
    ];

    // --- Lifecycle and Polling ---
    useEffect(() => {
        fetchProfile();
        fetchEmails();
        fetchPendingEmails();

        // Check countdown timer
        const timer = setInterval(() => setNow(new Date()), 1000);

        // Sync alerts and pending outbox every 15 seconds
        const pollInterval = setInterval(() => {
            checkAlerts();
            fetchPendingEmails();
        }, 15000);

        return () => {
            clearInterval(timer);
            clearInterval(pollInterval);
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // Play/Stop Audio Alarm based on urgentEmails presence
    useEffect(() => {
        if (urgentEmails.length > 0 && !audioRef.current) {
            audioRef.current = playAlarmSound(alarmTone);
        } else if (urgentEmails.length === 0 && audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }, [urgentEmails, alarmTone]);

    // Set default selected email when emails load
    useEffect(() => {
        if (!selectedEmail && emails.length > 0) {
            setSelectedEmail(emails[0]);
        }
    }, [emails]);

    // Re-check grammar whenever selected email changes
    useEffect(() => {
        if (selectedEmail) {
            // Populate mock grammar error details for the active email
            if (selectedEmail.id === 'mock_4' || selectedEmail.id === 'mock_1' || selectedEmail.subject.includes('123456')) {
                setGrammarErrors([
                    { original: 'alsoaticward', correction: 'documents', type: 'error' },
                    { original: 'submit the files by files by', correction: 'submit the files by tomorrow', type: 'error' },
                    { original: 'Please submit the files by b...', correction: 'Please submit the files by deadline', type: 'suggestion' }
                ]);
            } else {
                setGrammarErrors([
                    { original: 'errors errors', correction: 'errors', type: 'error' },
                    { original: 'Please submit the files by b...', correction: 'Please submit the files by...', type: 'suggestion' }
                ]);
            }
            // Clear translation when changing email
            setTranslatedText('');
        }
    }, [selectedEmail]);

    // --- API Calls ---
    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                const updated = {
                    name: data.name || '',
                    regNo: data.regNo || '',
                    collegeEmail: data.collegeEmail || '',
                    neoPatId: data.neoPatId || '',
                    alarmPassword: data.alarmPassword || 'STOP'
                };
                setProfile(updated);
                localStorage.setItem('nm_current_user', JSON.stringify(updated));
                return;
            }
        } catch (err) {
            console.error("Profile fetch failed:", err);
        }
        
        // Fallback to localStorage for simulated session
        const localUser = JSON.parse(localStorage.getItem('nm_current_user') || '{}');
        if (localUser && (localUser.email || localUser.collegeEmail)) {
            setProfile({
                name: localUser.name || '',
                regNo: localUser.regNo || '',
                collegeEmail: localUser.collegeEmail || localUser.email || '',
                neoPatId: localUser.neoPatId || '',
                alarmPassword: localUser.alarmPassword || 'STOP'
            });
        }
    };

    const saveProfile = async () => {
        // Sync locally first
        const localUser = JSON.parse(localStorage.getItem('nm_current_user') || '{}');
        const updated = { ...localUser, ...profile };
        localStorage.setItem('nm_current_user', JSON.stringify(updated));

        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setProfileOpen(false);
                alert("Rules and profile settings saved!");
                checkAlerts();
                return;
            }
        } catch (err) {
            console.error("Profile save failed:", err);
        }

        setProfileOpen(false);
        alert("Rules and profile settings saved locally!");
        checkAlerts();
    };

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/emails');
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    // Prepend real emails to mock ones
                    setEmails([...data, ...mockEmails]);
                } else {
                    setEmails(mockEmails);
                }
            } else {
                setEmails(mockEmails);
            }
        } catch (err) {
            console.error("Emails fetch failed, using fallback mock emails:", err);
            setEmails(mockEmails);
        }
        setLoading(false);
    };

    const fetchPendingEmails = async () => {
        try {
            const res = await fetch('/api/emails/pending');
            if (res.ok) {
                const data = await res.json();
                setPendingEmails(data || []);
            } else {
                setPendingEmails(mockPendingEmails);
            }
        } catch (err) {
            console.error("Pending outbox fetch failed, using mock data:", err);
            setPendingEmails(mockPendingEmails);
        }
    };

    const checkAlerts = async () => {
        try {
            const res = await fetch('/api/alerts/check');
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    setUrgentEmails(data);
                }
            }
        } catch (err) {
            console.error("Alerts check failed:", err);
        }
    };

    // --- Actions ---
    const handleSilenceAlarmAttempt = () => {
        if (silencePasswordInput === profile.alarmPassword) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setUrgentEmails([]);
            setSilencePasswordInput('');
            setSilenceError('');
            setSilenceOpen(false);
            alert("Alarm Silenced Successfully.");
        } else {
            setSilenceError("Invalid stop password!");
        }
    };

    const handleTranslate = async () => {
        if (!selectedEmail) return;
        setTranslateLoading(true);
        try {
            const res = await fetch('/api/translate/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: selectedEmail.body || selectedEmail.bodySnippet, language: translateLang })
            });
            if (res.ok) {
                const data = await res.json();
                setTranslatedText(data.explanation);
            } else {
                // Fallback translations if API fails
                const mockTrans = {
                    hindi: "यह ईमेल आपके अकादमिक पंजीकरण अद्यतन #123456 के बारे में है। कृपया सभी आवश्यक दस्तावेज तुरंत जमा करें। (MailSense AI Mock)",
                    tamil: "இந்த மின்னஞ்சல் உங்களது கல்வி பதிவு புதுப்பித்தல் #123456 பற்றியது. தேவையான ஆவணங்களை உடனடியாக சமர்ப்பிக்கவும். (MailSense AI Mock)",
                    telugu: "ఈ ఇమెయిల్ మీ విద్యా నమోదు నవీకరణ #123456 గురించి. దయచేసి అవసరమైన పత్రాలను వెంటనే సమర్పించండి. (MailSense AI Mock)",
                    malayalam: "ഈ ഇമെയിൽ നിങ്ങളുടെ അക്കാദമിക് രജിസ്ട്രേഷൻ അപ്ഡേറ്റ് #123456 സംബന്ധിച്ചുള്ളതാണ്. ദയവായി ആവശ്യമായ രേഖകൾ ഉടൻ സമർപ്പിക്കുക. (MailSense AI Mock)"
                };
                setTranslatedText(mockTrans[translateLang.toLowerCase()] || "Action required on email details immediately.");
            }
        } catch (err) {
            console.error("Translation call failed:", err);
            setTranslatedText("Translation error. Please review the email context manually.");
        }
        setTranslateLoading(false);
    };

    const handleSpeak = () => {
        const textToSpeak = translatedText || selectedEmail?.body || selectedEmail?.bodySnippet || "";
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const voices = window.speechSynthesis.getVoices();
        const langCode = {
            hindi: 'hi-IN',
            tamil: 'ta-IN',
            telugu: 'te-IN',
            malayalam: 'ml-IN'
        }[speakLangVoice] || 'en-US';

        utterance.lang = langCode;
        window.speechSynthesis.speak(utterance);
    };

    const handleComposeGenerate = async () => {
        if (!composePrompt) {
            alert("Please type a description of what you want to write!");
            return;
        }
        setComposeLoading(true);
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: composePrompt, tone: composeTone })
            });
            if (res.ok) {
                const data = await res.json();
                setComposeBody(data.draft);
                if (!composeSubject) {
                    setComposeSubject("Regarding: " + composePrompt.substring(0, 30));
                }
            } else {
                setComposeBody(`Subject: [AI Draft] Regarding ${composePrompt}\n\nDear Professor,\n\nI am writing to request details regarding ${composePrompt}.\n\nThank you,\n[Your Name]`);
            }
        } catch (err) {
            console.error("Compose generation failed:", err);
            setComposeBody(`Dear Professor,\n\nI am writing to request details regarding ${composePrompt}.\n\nThank you,\n[Your Name]`);
        }
        setComposeLoading(false);
    };

    const handleComposePolish = async () => {
        if (!composeBody) return;
        setComposeLoading(true);
        try {
            const res = await fetch('/api/ai/correct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: composeBody })
            });
            if (res.ok) {
                const data = await res.json();
                setComposeBody(data.corrected);
            }
        } catch (err) {
            console.error("Compose grammar polish failed:", err);
        }
        setComposeLoading(false);
    };

    const handleQueueSend = async () => {
        if (!composeTo || !composeSubject || !composeBody) {
            alert("All fields are required!");
            return;
        }
        try {
            const res = await fetch('/api/emails/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody })
            });
            if (res.ok) {
                alert("Email queued successfully! It will be sent in 15 minutes. Review or cancel it in 'Drafts/Outbox'.");
                setComposeOpen(false);
                setComposeTo('');
                setComposeSubject('');
                setComposeBody('');
                setComposePrompt('');
                fetchPendingEmails();
            } else {
                alert("Failed to queue email.");
            }
        } catch (err) {
            console.error("Failed to queue:", err);
        }
    };

    const handleRecallOutbox = async (id) => {
        if (!confirm("Are you sure you want to recall and delete this email? This action cannot be undone.")) {
            return;
        }
        try {
            const res = await fetch(`/api/emails/pending/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("Email recalled and deleted.");
                fetchPendingEmails();
                setSelectedEmail(null);
            }
        } catch (err) {
            console.error("Recall failed:", err);
        }
    };

    const handleSaveEditOutbox = async () => {
        if (!editTo || !editSubject || !editBody) {
            alert("All fields are required!");
            return;
        }
        try {
            const res = await fetch(`/api/emails/pending/${editingMail.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: editTo, subject: editSubject, body: editBody })
            });
            if (res.ok) {
                alert("Outbox email updated successfully!");
                setEditingMail(null);
                fetchPendingEmails();
                setSelectedEmail(null);
            }
        } catch (err) {
            console.error("Save edit outbox failed:", err);
        }
    };

    const startEditOutbox = (mail) => {
        setEditingMail(mail);
        setEditTo(mail.recipientEmail);
        setEditSubject(mail.subject);
        setEditBody(mail.body);
    };

    // --- Helpers ---
    const getRemainingTime = (sendAtStr) => {
        const sendAt = new Date(sendAtStr);
        const diffMs = sendAt.getTime() - now.getTime();
        if (diffMs <= 0) return 'Sending...';

        const diffSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- GPT Assistant Responses ---
    const handleGptAction = async () => {
        setGptLoading(true);
        let promptText = gptPrompt;
        if (!promptText) {
            promptText = gptActiveOption + " for email: " + (selectedEmail?.body || selectedEmail?.bodySnippet);
        }
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptText, tone: 'formal' })
            });
            if (res.ok) {
                const data = await res.json();
                setComposeTo(selectedEmail?.from || '');
                setComposeSubject("Re: " + (selectedEmail?.subject || ''));
                setComposeBody(data.draft);
                setComposeOpen(true); // Open compose dialog prefilled
            }
        } catch (err) {
            console.error("GPT Action generation failed:", err);
        }
        setGptLoading(false);
    };

    // --- Filter Emails by Search / Folder ---
    const filteredEmails = emails.filter(email => {
        // Folder check
        if (activeFolder === 'priority' && !email.isUrgent) return false;
        
        // Search check
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                email.from.toLowerCase().includes(query) ||
                email.subject.toLowerCase().includes(query) ||
                email.bodySnippet.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const isAlarmActive = urgentEmails.length > 0;

    return (
        <div className="nexmail-app">
            
            {/* Topbar */}
            <header className="nexmail-topbar">
                <div className="nexmail-topbar-left">
                    <button className="nexmail-hamburger" onClick={() => fetchEmails()}>☰</button>
                    <div className="nexmail-logo">
                        <span>Nex</span><span>Mail</span>
                    </div>
                    <button className="nexmail-hamburger" style={{ fontSize: '16px' }}>🔔</button>
                </div>

                <div className="nexmail-search-wrapper">
                    <span className="nexmail-search-icon">🔍</span>
                    <input
                        type="text"
                        className="nexmail-search-bar"
                        placeholder="Search mail..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="nexmail-search-caret">▼</span>
                </div>

                <div className="nexmail-profile-section">
                    <button className="nexmail-btn-standard" style={{ height: '32px', padding: '0 12px', fontSize: '12px' }} onClick={() => setProfileOpen(true)}>
                        ⚙️ Filters & Rules
                    </button>
                    {onLogout && (
                        <button className="nexmail-btn-standard" style={{ height: '32px', padding: '0 12px', fontSize: '12px', borderColor: '#f87171', color: '#ef4444' }} onClick={onLogout}>
                            🚪 Log Out
                        </button>
                    )}
                    <img
                        className="nexmail-profile-avatar"
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                        alt="Profile"
                        onClick={() => setProfileOpen(true)}
                    />
                </div>
            </header>

            {/* Workspace split panes */}
            <div className="nexmail-workspace">
                
                {/* Column 1: Sidebar */}
                <aside className="nexmail-sidebar">
                    <button className="nexmail-compose-btn" onClick={() => setComposeOpen(true)}>
                        <span>➕</span> Compose
                    </button>

                    <div className="nexmail-menu-section">
                        <div className="nexmail-menu-section-title">Mailboxes</div>
                        <div className={`nexmail-menu-item ${activeFolder === 'inbox' ? 'active' : ''}`} onClick={() => { setActiveFolder('inbox'); setSelectedEmail(null); }}>
                            <div className="nexmail-menu-item-left">
                                <span>📥</span> Inbox
                            </div>
                            <span className="nexmail-menu-badge blue">12</span>
                        </div>
                        <div className={`nexmail-menu-item ${activeFolder === 'priority' ? 'active' : ''}`} onClick={() => { setActiveFolder('priority'); setSelectedEmail(null); }}>
                            <div className="nexmail-menu-item-left">
                                <span>⭐</span> Priority
                            </div>
                            <span className="nexmail-menu-badge">3</span>
                        </div>
                        <div className={`nexmail-menu-item ${activeFolder === 'drafts' ? 'active' : ''}`} onClick={() => { setActiveFolder('drafts'); setSelectedEmail(null); }}>
                            <div className="nexmail-menu-item-left">
                                <span>📝</span> Drafts / Outbox
                            </div>
                            <span className="nexmail-menu-badge">{pendingEmails.length}</span>
                        </div>
                        <div className={`nexmail-menu-item ${activeFolder === 'sent' ? 'active' : ''}`} onClick={() => { setActiveFolder('sent'); setSelectedEmail(null); }}>
                            <div className="nexmail-menu-item-left">
                                <span>✈️</span> Sent
                            </div>
                        </div>
                    </div>

                    <div className="nexmail-menu-section">
                        <div className="nexmail-menu-section-title">Alarm Alerts</div>
                        <div className="nexmail-menu-item" style={{ color: isAlarmActive ? 'var(--urgent)' : 'inherit', fontWeight: isAlarmActive ? '700' : 'normal' }}>
                            <div className="nexmail-menu-item-left">
                                <span>⚠️</span> High-priority
                            </div>
                            <span className="nexmail-menu-badge red">{urgentEmails.length}</span>
                        </div>
                        <div className="nexmail-menu-item">
                            <div className="nexmail-menu-item-left">
                                <span>📥</span> Inbox
                            </div>
                        </div>
                        <div className="nexmail-menu-item">
                            <div className="nexmail-menu-item-left">
                                <span>📝</span> Drafts
                            </div>
                        </div>
                        <div className="nexmail-menu-item">
                            <div className="nexmail-menu-item-left">
                                <span>✈️</span> Sent
                            </div>
                        </div>
                    </div>

                    {/* Synchronized Mobile App Illustration */}
                    <div className="nexmail-mobile-sync-card">
                        <div className="nexmail-mobile-sync-title">Synchronized Mobile App</div>
                        <img className="nexmail-mobile-sync-img" src={syncMobileAppImg} alt="Mobile Mockups" />
                    </div>

                    {/* Sidebar Footer */}
                    <div className="nexmail-sidebar-footer">
                        <button className="nexmail-footer-icon-btn">💬</button>
                        <button className="nexmail-footer-icon-btn">🗑️</button>
                        <button className="nexmail-footer-icon-btn">📁</button>
                        <button className="nexmail-footer-icon-btn" onClick={() => setProfileOpen(true)}>⚙️</button>
                    </div>
                </aside>

                {/* Column 2: Email List Pane */}
                <main className="nexmail-list-pane">
                    <div className="nexmail-list-header">
                        <div className="nexmail-list-header-left">
                            <input type="checkbox" style={{ marginRight: '6px' }} />
                            <span>▼</span>
                            <span style={{ fontSize: '16px', color: '#cbd5e1' }}>|</span>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={fetchEmails}>↻</button>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>1-50 of 124</span>
                    </div>

                    <div className="nexmail-emails-container">
                        {activeFolder === 'drafts' ? (
                            // Outbox listings
                            pendingEmails.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📤</div>
                                    <p style={{ fontSize: '13px' }}>No pending outgoing emails in 15m recall window.</p>
                                </div>
                            ) : (
                                pendingEmails.map(mail => {
                                    const remaining = getRemainingTime(mail.sendAt);
                                    const isSelected = selectedEmail?.id === mail.id;
                                    return (
                                        <div
                                            key={mail.id}
                                            className={`nexmail-email-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => setSelectedEmail(mail)}
                                        >
                                            <div className="nexmail-email-item-top">
                                                <span className="nexmail-email-sender" style={{ color: '#4f46e5' }}>To: {mail.recipientEmail}</span>
                                                <span className="nexmail-email-time" style={{ color: '#f59e0b', fontWeight: 'bold' }}>{remaining}</span>
                                            </div>
                                            <div className="nexmail-email-subject">PENDING: {mail.subject}</div>
                                            <div className="nexmail-email-snippet">{mail.body}</div>
                                        </div>
                                    );
                                })
                            )
                        ) : (
                            // Inbox/Priority listings
                            filteredEmails.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📧</div>
                                    <p style={{ fontSize: '13px' }}>No emails found in this folder.</p>
                                </div>
                            ) : (
                                filteredEmails.map(email => {
                                    const isSelected = selectedEmail?.id === email.id;
                                    const isTriggered = email.isUrgent;
                                    return (
                                        <div
                                            key={email.id}
                                            className={`nexmail-email-item ${isSelected ? 'selected' : ''} ${isTriggered ? 'alarm-triggered' : ''}`}
                                            onClick={() => setSelectedEmail(email)}
                                        >
                                            <div className="nexmail-email-item-top">
                                                <span className="nexmail-email-sender">{email.from}</span>
                                                <span className="nexmail-email-time">
                                                    {email.id.startsWith('mock_') ? 'Now' : new Date(email.internalDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="nexmail-email-subject">
                                                {email.subject}
                                                {isTriggered && <span className="nexmail-badge-alarm">ALARM TRIGGER</span>}
                                            </div>
                                            <div className="nexmail-email-snippet">{email.bodySnippet}</div>
                                        </div>
                                    );
                                })
                            )
                        )}
                    </div>
                </main>

                {/* Column 3: Email Detail & Tools Pane */}
                <section className="nexmail-detail-pane">
                    {selectedEmail ? (
                        <>
                            {/* Detail Header */}
                            <div className="nexmail-detail-header">
                                <div className="nexmail-detail-header-left">
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={() => setSelectedEmail(null)}>←</button>
                                    <h2 className="nexmail-detail-title">{selectedEmail.subject}</h2>
                                </div>
                                <div className="nexmail-detail-header-right">
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => window.print()}>🖨️</button>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>⤢</button>
                                </div>
                            </div>

                            {/* Detail Body Container */}
                            <div className="nexmail-detail-body-container">
                                
                                {/* Priority Alert sounding banner if urgent */}
                                {selectedEmail.isUrgent && isAlarmActive && (
                                    <div className="nexmail-alarm-banner">
                                        <div className="nexmail-alarm-banner-text">
                                            Priority Alert Triggered: 'URGENT', 'Registration #123456'. Alarm sounding... <br />
                                            Active: URGENT / #123456
                                        </div>
                                        <button className="nexmail-alarm-banner-btn" onClick={() => setSilenceOpen(true)}>
                                            SILENCE ALARM
                                        </button>
                                    </div>
                                )}

                                {/* Sender Details */}
                                <div className="nexmail-sender-profile">
                                    <div className="nexmail-sender-avatar-letter">
                                        {(selectedEmail.from || selectedEmail.recipientEmail || 'P').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="nexmail-sender-details">
                                        <div className="nexmail-sender-name">{selectedEmail.from || `To: ${selectedEmail.recipientEmail}`}</div>
                                        <div className="nexmail-sender-to">to me ▼</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
                                        <span style={{ fontSize: '12px' }}>7:38 AM hours ago</span>
                                        <span>☆</span>
                                        <span>↩️</span>
                                        <span>⋮</span>
                                    </div>
                                </div>

                                {/* Main Email Body Text */}
                                <div className="nexmail-email-body-text">
                                    {selectedEmail.body || selectedEmail.bodySnippet}
                                </div>

                                {/* Check if this is an outbox/pending email to show actions */}
                                {selectedEmail.status === 'PENDING' && (
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                        <button className="nexmail-btn-standard" onClick={() => startEditOutbox(selectedEmail)}>
                                            ✏️ Edit Draft
                                        </button>
                                        <button className="nexmail-btn-standard" style={{ borderColor: '#fca5a5', color: '#b91c1c' }} onClick={() => handleRecallOutbox(selectedEmail.id)}>
                                            🛑 Recall & Delete
                                        </button>
                                    </div>
                                )}

                                {/* Integrated Tools Section at the bottom */}
                                <div className="nexmail-tools-section">
                                    <div className="nexmail-tools-tabs">
                                        <div className="nexmail-tools-tabs-left">
                                            <span className="nexmail-tools-tab">INTEGRATED TOOLS ℹ️</span>
                                        </div>
                                        <div className="nexmail-tools-tabs-right">
                                            <span>⚙️</span>
                                            <span>▲</span>
                                        </div>
                                    </div>

                                    {/* Three side-by-side modules */}
                                    <div className="nexmail-tools-grid">
                                        
                                        {/* Tool 1: Translate & Speak */}
                                        <div className="nexmail-tool-card">
                                            <div className="nexmail-tool-card-header">
                                                <span className="nexmail-tool-card-title">Translate & Speak</span>
                                                <span>⋮</span>
                                            </div>
                                            <div className="nexmail-tool-input-label">Native languages</div>
                                            <select
                                                className="nexmail-tool-select"
                                                value={translateLang}
                                                onChange={(e) => setTranslateLang(e.target.value)}
                                            >
                                                <option value="hindi">Hindi</option>
                                                <option value="tamil">Tamil</option>
                                                <option value="telugu">Telugu</option>
                                                <option value="malayalam">Malayalam</option>
                                            </select>

                                            <div className="nexmail-tool-btn-group">
                                                <button className="nexmail-tool-btn-primary" onClick={handleTranslate} disabled={translateLoading}>
                                                    {translateLoading ? '...' : 'TRANSLATE'}
                                                </button>
                                                <button className="nexmail-tool-btn-secondary" onClick={handleSpeak}>
                                                    🔊 LISTEN
                                                </button>
                                            </div>

                                            <select
                                                className="nexmail-tool-select"
                                                style={{ height: '28px', padding: '0 4px', fontSize: '11px', marginBottom: '8px' }}
                                                value={speakLangVoice}
                                                onChange={(e) => setSpeakLangVoice(e.target.value)}
                                            >
                                                <option value="hindi">Hindi Voice</option>
                                                <option value="tamil">Tamil Voice</option>
                                                <option value="telugu">Telugu Voice</option>
                                                <option value="malayalam">Malayalam Voice</option>
                                            </select>

                                            <textarea
                                                className="nexmail-tool-textarea"
                                                placeholder="Translation will appear here..."
                                                value={translatedText}
                                                readOnly
                                            />
                                        </div>

                                        {/* Tool 2: Quilbot Grammar Checker */}
                                        <div className="nexmail-tool-card">
                                            <div className="nexmail-tool-card-header">
                                                <span className="nexmail-tool-card-title">Quilbot Grammar Checker</span>
                                                <span>⋮</span>
                                            </div>
                                            <div className="nexmail-grammar-error-header">Errors errors:</div>
                                            <div className="nexmail-grammar-box">
                                                {grammarErrors.map((err, i) => (
                                                    <div key={i} className={`nexmail-grammar-item ${err.type === 'error' ? 'red' : 'green'}`}>
                                                        <div className="nexmail-grammar-correction">
                                                            {err.type === 'error' ? 'Corrected to:' : 'Suggested suggestion:'}
                                                        </div>
                                                        <div style={{ textDecoration: err.type === 'error' ? 'line-through' : 'none' }}>
                                                            {err.original}
                                                        </div>
                                                        <div style={{ fontWeight: 'bold', marginTop: '2px' }}>
                                                            {err.correction}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Tool 3: Mail GPT Assistant */}
                                        <div className="nexmail-tool-card">
                                            <div className="nexmail-tool-card-header">
                                                <span className="nexmail-tool-card-title">Mail GPT Assistant</span>
                                                <span>⋮</span>
                                            </div>
                                            
                                            <div className="nexmail-gpt-options">
                                                {[
                                                    'Draft Reply: Acknowledge & Confirm',
                                                    'Summarize Mail',
                                                    'Summarize Mail to reply',
                                                    'Confirm retieoro upting A..'
                                                ].map(option => (
                                                    <div
                                                        key={option}
                                                        className={`nexmail-gpt-option-card ${gptActiveOption === option ? 'active' : ''}`}
                                                        onClick={() => {
                                                            setGptActiveOption(option);
                                                            setGptPrompt(option);
                                                        }}
                                                    >
                                                        {option}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="nexmail-gpt-prompt-box">
                                                <input
                                                    type="text"
                                                    className="nexmail-gpt-input"
                                                    placeholder="Prompt Summarize Mail"
                                                    value={gptPrompt}
                                                    onChange={(e) => setGptPrompt(e.target.value)}
                                                />
                                                <button className="nexmail-gpt-send-btn" onClick={handleGptAction}>
                                                    ➔
                                                </button>
                                            </div>

                                            <button className="nexmail-gpt-generate-btn" onClick={handleGptAction} disabled={gptLoading}>
                                                {gptLoading ? 'Generating...' : 'GENERATE REPLY'}
                                            </button>
                                        </div>

                                    </div>
                                </div>

                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
                            <p>Select an email to view details and use intelligent academic tools.</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Bottom Status bar */}
            <footer className="nexmail-statusbar">
                <div className="nexmail-statusbar-item">
                    <span className="nexmail-status-dot"></span>
                    Syncing with Gmail/Outlook API
                </div>
                <div className="nexmail-statusbar-item">
                    <span className="nexmail-status-dot"></span>
                    Backend: Java Spring Boot Services Active
                </div>
            </footer>

            {/* --- Modals & Overlays --- */}

            {/* 1. Compose Modal */}
            {composeOpen && (
                <div className="nexmail-compose-modal-overlay">
                    <div className="nexmail-compose-modal">
                        <div className="nexmail-compose-modal-header">
                            <span>🤖 NexMail AI Compose</span>
                            <button className="nexmail-modal-close-btn" onClick={() => setComposeOpen(false)}>×</button>
                        </div>
                        
                        <div className="nexmail-compose-modal-body">
                            <div className="nexmail-form-group">
                                <label className="nexmail-form-label">To (Recipient Email)</label>
                                <input
                                    type="text"
                                    className="nexmail-form-input"
                                    placeholder="professor@college.edu"
                                    value={composeTo}
                                    onChange={(e) => setComposeTo(e.target.value)}
                                />
                            </div>
                            <div className="nexmail-form-group">
                                <label className="nexmail-form-label">Subject</label>
                                <input
                                    type="text"
                                    className="nexmail-form-input"
                                    placeholder="Enter subject"
                                    value={composeSubject}
                                    onChange={(e) => setComposeSubject(e.target.value)}
                                />
                            </div>
                            <div className="nexmail-form-group">
                                <label className="nexmail-form-label">AI Assistant Prompt</label>
                                <textarea
                                    className="nexmail-form-input"
                                    rows={2}
                                    placeholder="Describe what you want to write (e.g. extension for course registry files)"
                                    value={composePrompt}
                                    onChange={(e) => setComposePrompt(e.target.value)}
                                />
                                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                    <select
                                        className="nexmail-tool-select"
                                        style={{ width: '130px', height: '32px', marginBottom: 0 }}
                                        value={composeTone}
                                        onChange={(e) => setComposeTone(e.target.value)}
                                    >
                                        <option value="formal">Formal</option>
                                        <option value="semi-formal">Semi-Formal</option>
                                        <option value="polite">Polite Request</option>
                                    </select>
                                    <button className="nexmail-btn-standard" style={{ height: '32px' }} onClick={handleComposeGenerate} disabled={composeLoading}>
                                        {composeLoading ? 'Generating...' : '🤖 Generate AI Draft'}
                                    </button>
                                </div>
                            </div>
                            <div className="nexmail-form-group">
                                <label className="nexmail-form-label">Email Draft Body</label>
                                <textarea
                                    className="nexmail-form-textarea"
                                    rows={8}
                                    placeholder="Write your email here or generate using the prompt above..."
                                    value={composeBody}
                                    onChange={(e) => setComposeBody(e.target.value)}
                                />
                                <button className="nexmail-btn-standard" style={{ marginTop: '6px', backgroundColor: '#e6fffa', borderColor: '#319795', color: '#234e52' }} onClick={handleComposePolish} disabled={composeLoading}>
                                    ✨ Polish Grammar & Tone
                                </button>
                            </div>
                        </div>

                        <div className="nexmail-compose-modal-footer">
                            <button className="nexmail-btn-standard" onClick={() => setComposeOpen(false)}>Cancel</button>
                            <button className="nexmail-btn-primary" onClick={handleQueueSend}>🚀 Queue Send (15m delay)</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Settings / Filters Profile Modal */}
            {profileOpen && (
                <div className="nexmail-profile-modal-overlay">
                    <div className="nexmail-compose-modal" style={{ width: '500px' }}>
                        <div className="nexmail-compose-modal-header">
                            <span>⚙️ Academic Smart Filters & Rules</span>
                            <button className="nexmail-modal-close-btn" onClick={() => setProfileOpen(false)}>×</button>
                        </div>

                        <div className="nexmail-compose-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="nexmail-form-group">
                                    <label className="nexmail-form-label">Student Name</label>
                                    <input
                                        type="text"
                                        className="nexmail-form-input"
                                        placeholder="John Doe"
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                                <div className="nexmail-form-group">
                                    <label className="nexmail-form-label">Registration No</label>
                                    <input
                                        type="text"
                                        className="nexmail-form-input"
                                        placeholder="2021CSE001"
                                        value={profile.regNo}
                                        onChange={e => setProfile({ ...profile, regNo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="nexmail-form-group">
                                <label className="nexmail-form-label">College Email Address</label>
                                <input
                                    type="email"
                                    className="nexmail-form-input"
                                    placeholder="john.d@college.edu"
                                    value={profile.collegeEmail}
                                    onChange={e => setProfile({ ...profile, collegeEmail: e.target.value })}
                                />
                            </div>

                            <div className="nexmail-form-group">
                                <label className="nexmail-form-label">NeoPat Student ID</label>
                                <input
                                    type="text"
                                    className="nexmail-form-input"
                                    placeholder="NP12345"
                                    value={profile.neoPatId}
                                    onChange={e => setProfile({ ...profile, neoPatId: e.target.value })}
                                />
                            </div>

                            <div className="nexmail-form-group">
                                <label className="nexmail-form-label">Alarm Sound Terminate Password</label>
                                <input
                                    type="password"
                                    className="nexmail-form-input"
                                    placeholder="Password to silence persistent alarm"
                                    value={profile.alarmPassword}
                                    onChange={e => setProfile({ ...profile, alarmPassword: e.target.value })}
                                />
                            </div>

                            <div className="nexmail-form-group">
                                <label className="nexmail-form-label">Default Emergency Siren Tone</label>
                                <select
                                    className="nexmail-tool-select"
                                    value={alarmTone}
                                    onChange={(e) => setAlarmTone(e.target.value)}
                                >
                                    <option value={ALARM_TONES.emergency}>🚨 Emergency Siren</option>
                                    <option value={ALARM_TONES.siren}>🔊 Police Siren</option>
                                    <option value={ALARM_TONES.beep}>⚠️ Warning Beeps</option>
                                </select>
                            </div>
                        </div>

                        <div className="nexmail-compose-modal-footer">
                            <button className="nexmail-btn-standard" onClick={() => setProfileOpen(false)}>Close</button>
                            <button className="nexmail-btn-primary" onClick={saveProfile}>Save & Apply Rules</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Silence Alarm Verification Modal */}
            {silenceOpen && (
                <div className="nexmail-profile-modal-overlay" style={{ zIndex: 100000 }}>
                    <div className="nexmail-compose-modal" style={{ width: '400px', borderColor: '#fca5a5' }}>
                        <div className="nexmail-compose-modal-header" style={{ color: '#991b1b', backgroundColor: '#fee2e2' }}>
                            <span>🛑 Verify Stop Password</span>
                            <button className="nexmail-modal-close-btn" onClick={() => setSilenceOpen(false)}>×</button>
                        </div>

                        <div className="nexmail-compose-modal-body" style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '12px' }}>
                                A persistent high-priority alarm is sounding. Enter the alarm password to mute.
                            </p>
                            <div className="nexmail-form-group">
                                <input
                                    type="password"
                                    className="nexmail-form-input"
                                    style={{ textAlign: 'center', fontSize: '16px', letterSpacing: '4px' }}
                                    placeholder="••••••••"
                                    value={silencePasswordInput}
                                    onChange={(e) => setSilencePasswordInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSilenceAlarmAttempt()}
                                />
                                {silenceError && <p style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold', marginTop: '6px' }}>{silenceError}</p>}
                            </div>
                        </div>

                        <div className="nexmail-compose-modal-footer">
                            <button className="nexmail-btn-standard" onClick={() => setSilenceOpen(false)}>Cancel</button>
                            <button className="nexmail-btn-primary" style={{ backgroundColor: '#dc2626' }} onClick={handleSilenceAlarmAttempt}>
                                SILENCE NOW
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Edit Outbox Email Modal */}
            {editingMail && (
                <div className="nexmail-compose-modal-overlay">
                    <div className="nexmail-compose-modal">
                        <div className="nexmail-compose-modal-header">
                            <span>✏️ Edit Pending Email</span>
                            <button className="nexmail-modal-close-btn" onClick={() => setEditingMail(null)}>×</button>
                        </div>

                        <div className="nexmail-compose-modal-body">
                            <div className="nexmail-form-group">
                                <label className="nexmail-form-label">To</label>
                                <input
                                    type="text"
                                    className="nexmail-form-input"
                                    value={editTo}
                                    onChange={(e) => setEditTo(e.target.value)}
                                />
                            </div>
                            <div className="nexmail-form-group">
                                <label className="nexmail-form-label">Subject</label>
                                <input
                                    type="text"
                                    className="nexmail-form-input"
                                    value={editSubject}
                                    onChange={(e) => setEditSubject(e.target.value)}
                                />
                            </div>
                            <div className="nexmail-form-group">
                                <label className="nexmail-form-label">Body</label>
                                <textarea
                                    className="nexmail-form-textarea"
                                    rows={8}
                                    value={editBody}
                                    onChange={(e) => setEditBody(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="nexmail-compose-modal-footer">
                            <button className="nexmail-btn-standard" onClick={() => setEditingMail(null)}>Cancel</button>
                            <button className="nexmail-btn-primary" onClick={handleSaveEditOutbox}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
