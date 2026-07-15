import React, { useState, useEffect, useRef } from 'react';
import { playAlarmSound, stopAlarm, ALARM_TONES } from '../services/AlarmService';
import syncMobileAppImg from '../synchronized_mobile_app.png';

const mockPendingEmails = [
    {
        id: 'mock_pending_1',
        recipientEmail: 'professor.vit@gmail.com',
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
    const [sentEmails, setSentEmails] = useState([]);
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
    
    // Silence Verification / Stop Alarm Challenge States
    const [activeAlarmChallenge, setActiveAlarmChallenge] = useState('passcode'); // 'passcode' | 'pattern' | 'math' | 'face'
    const [silencePasswordInput, setSilencePasswordInput] = useState('');
    const [silenceError, setSilenceError] = useState('');
    
    // Math Challenge States
    const [mathQuestion, setMathQuestion] = useState({ text: '17 + 28', answer: 45 });
    const [mathInput, setMathInput] = useState('');
    
    // Pattern Challenge States
    const [patternNodes, setPatternNodes] = useState([]);
    
    // Face ID Challenge States
    const [faceScanState, setFaceScanState] = useState('idle'); // 'idle' | 'scanning' | 'success'
    const [videoStream, setVideoStream] = useState(null);
    const videoRef = useRef(null);
    
    // Compose Form States
    const [composeTo, setComposeTo] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [composePrompt, setComposePrompt] = useState('');
    const [composeTone, setComposeTone] = useState('formal');
    const [composeLoading, setComposeLoading] = useState(false);
    
    // AI Panel Toggle in Composer
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [speechRecording, setSpeechRecording] = useState(false);
    const [speechResultText, setSpeechResultText] = useState('');
    
    // Grammarly & Quillbot states inside Composer
    const [grammarChecked, setGrammarChecked] = useState(false);
    const [grammarErrors, setGrammarErrors] = useState([]);
    
    // Undo Send states
    const [showUndoBanner, setShowUndoBanner] = useState(false);
    const [undoCountdown, setUndoCountdown] = useState(60);
    const [pendingUndoEmail, setPendingUndoEmail] = useState(null);
    const undoTimerRef = useRef(null);

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

    // GPT Assistant States
    const [gptPrompt, setGptPrompt] = useState('');
    const [gptActiveOption, setGptActiveOption] = useState('Draft Reply: Acknowledge & Confirm');
    const [gptLoading, setGptLoading] = useState(false);

    // Clock state for outbox countdowns
    const [now, setNow] = useState(new Date());

    // Audio Instance Ref
    const alarmInstanceRef = useRef(null);

    // --- High-Fidelity Mock Emails Matching the Screenshot ---
    const mockEmails = [
        {
            id: 'mock_1',
            from: 'Prathralin S',
            subject: '[IMPORTANT] Registration #123456 Update - ACTION REQUIRED',
            bodySnippet: 'Hello, Please note that you have an important registration update pending for your course assignment. Immediate action is required to verify details.',
            internalDate: new Date(Date.now() - 5 * 60000).getTime(), // 5 mins ago
            isUrgent: true,
            body: 'Hello,\n\nPlease note that you have an important registration update pending for your course assignment. Immediate action is required to verify your details and complete the registry.\n\nBest regards,\nRegistration Team'
        },
        {
            id: 'mock_2',
            from: 'Prof. Sharma',
            subject: '[URGENT] Verify ID files for Registrar Office',
            bodySnippet: 'Dear student, please make sure your registration documents are submitted immediately. This needs to be added to your profile files.',
            internalDate: Date.now(), // now
            isUrgent: true,
            body: 'Dear student,\n\nPlease make sure your registration documents are submitted immediately. This needs to be added to your profile files. Let me know if you face any issues.\n\nSincerely,\nProf. Sharma'
        },
        {
            id: 'mock_3',
            from: 'Office of Registrar',
            subject: '[URGENT] Registration #123456 Update - Suspended unless submitted',
            bodySnippet: 'Hello, Please check your course registration files. Urgent registration action is required to verify your enrollment. Immediate response is requested.',
            internalDate: new Date(Date.now() - 3 * 3600000).getTime(), // 3 hours ago
            isUrgent: true,
            body: 'Hello,\n\nPlease check your course registration files. Urgent registration action is required to verify your enrollment. Immediate response is requested, failing which registry might be suspended.\n\nBest regards,\nOffice of Registrar'
        },
        {
            id: 'mock_4',
            from: 'Prof. Sharma',
            subject: 'Academic Updates and Course Materials',
            bodySnippet: 'Hello, Thank you for sending the materials. Please review the course syllabus attached.',
            internalDate: new Date(Date.now() - 8 * 3600000).getTime(), // 8 hours ago
            isUrgent: false,
            body: 'Hello,\n\nThank you for sending the materials. Please review the course syllabus attached and bring printouts for class tomorrow.'
        },
        {
            id: 'mock_5',
            from: 'LinkedIn Job Alerts',
            subject: 'React Developer at unconsolidated startup - India jobs',
            bodySnippet: 'Hello, there is a registration issue that requires your immediate attention. Please check the job recommendations.',
            internalDate: new Date(Date.now() - 10 * 3600000).getTime(),
            isUrgent: false,
            body: 'Hey Akarsh, 15 new jobs match your profile search for React Developer in Bangalore, India.'
        }
    ];

    // --- Lifecycle and Polling ---
    useEffect(() => {
        fetchProfile();
        fetchEmails();
        fetchPendingEmails();
        loadSentEmails();

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
            if (alarmInstanceRef.current) {
                alarmInstanceRef.current.pause();
            }
            stopCamera();
        };
    }, []);

    // Play/Stop Audio Alarm based on urgentEmails presence
    useEffect(() => {
        const silenced = JSON.parse(localStorage.getItem('nm_silenced_alarms') || '[]');
        const activeUrgent = urgentEmails.filter(email => !silenced.includes(email.id));

        if (activeUrgent.length > 0) {
            if (!alarmInstanceRef.current) {
                alarmInstanceRef.current = playAlarmSound(alarmTone);
            }
            setSilenceOpen(true); // Always force fullscreen challenge overlay
        } else {
            if (alarmInstanceRef.current) {
                alarmInstanceRef.current.pause();
                alarmInstanceRef.current = null;
            }
            setSilenceOpen(false);
        }
    }, [urgentEmails, alarmTone]);

    // Set default selected email when emails load
    useEffect(() => {
        if (!selectedEmail && emails.length > 0) {
            setSelectedEmail(emails[0]);
        }
    }, [emails]);

    // --- Grammar Checker Mock Corrections ---
    useEffect(() => {
        if (selectedEmail) {
            // Populate mock grammar error details for the active email
            setTranslatedText('');
        }
    }, [selectedEmail]);

    // --- API & Storage Calls ---
    const fetchProfile = async () => {
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

    const saveProfile = () => {
        const localUser = JSON.parse(localStorage.getItem('nm_current_user') || '{}');
        const updated = { ...localUser, ...profile };
        localStorage.setItem('nm_current_user', JSON.stringify(updated));
        setProfileOpen(false);
        alert("Smart filters & profile parameters saved locally!");
        checkAlerts();
    };

    const fetchEmails = () => {
        setLoading(true);
        // Load mock emails + check if any contain "urgent" or "important"
        setTimeout(() => {
            setEmails(mockEmails);
            checkAlertsLocally(mockEmails);
            setLoading(false);
        }, 300);
    };

    const checkAlertsLocally = (emailList) => {
        const silenced = JSON.parse(localStorage.getItem('nm_silenced_alarms') || '[]');
        const userName = (profile.name || '').toLowerCase().trim();
        const matches = emailList.filter(email => {
            const subject = (email.subject || '').toLowerCase();
            const body = (email.body || '').toLowerCase();
            
            const hasKeyword = 
                subject.includes('urgent') || 
                body.includes('urgent') || 
                subject.includes('important') || 
                body.includes('important') || 
                subject.includes('akarsh jain') || 
                body.includes('akarsh jain') ||
                (userName && (subject.includes(userName) || body.includes(userName)));
                
            return hasKeyword && !silenced.includes(email.id);
        });
        setUrgentEmails(matches);
    };

    const fetchPendingEmails = async () => {
        setPendingEmails(mockPendingEmails);
    };

    const loadSentEmails = () => {
        const sent = JSON.parse(localStorage.getItem('nm_sent_emails') || '[]');
        setSentEmails(sent);
    };

    const checkAlerts = () => {
        checkAlertsLocally(emails.length > 0 ? emails : mockEmails);
    };

    // --- ALARM CHALLENGES DISMISS LOGIC ---

    const generateMathQuestion = () => {
        const n1 = Math.floor(Math.random() * 50) + 10;
        const n2 = Math.floor(Math.random() * 50) + 10;
        setMathQuestion({
            text: `${n1} + ${n2}`,
            answer: n1 + n2
        });
        setMathInput('');
    };

    // Draw Pattern challenge connects sequentially
    const handlePatternClick = (num) => {
        if (patternNodes.includes(num)) return;
        setPatternNodes([...patternNodes, num]);
    };

    const verifyPattern = () => {
        if (patternNodes.length >= 4) {
            silenceAlarmSuccessfully();
        } else {
            alert("Pattern must connect at least 4 dots!");
            setPatternNodes([]);
        }
    };

    const verifyMath = (e) => {
        e.preventDefault();
        if (parseInt(mathInput) === mathQuestion.answer) {
            silenceAlarmSuccessfully();
        } else {
            alert("Wrong answer! Try again.");
            generateMathQuestion();
        }
    };

    const startCamera = async () => {
        setFaceScanState('scanning');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setVideoStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            
            // Wait 3 seconds to scan face
            setTimeout(() => {
                setFaceScanState('success');
                setTimeout(() => {
                    silenceAlarmSuccessfully();
                }, 800);
            }, 3000);
        } catch (err) {
            console.warn("Camera blocked, playing simulated biometric scan:", err);
            // Simulated fallback scan
            setTimeout(() => {
                setFaceScanState('success');
                setTimeout(() => {
                    silenceAlarmSuccessfully();
                }, 800);
            }, 3500);
        }
    };

    const stopCamera = () => {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null);
        }
    };

    const silenceAlarmSuccessfully = () => {
        stopAlarm();
        stopCamera();

        // Mark active urgent emails as silenced in localStorage
        const silenced = JSON.parse(localStorage.getItem('nm_silenced_alarms') || '[]');
        const urgentIds = urgentEmails.map(u => u.id);
        const updatedSilenced = [...silenced, ...urgentIds];
        localStorage.setItem('nm_silenced_alarms', JSON.stringify(updatedSilenced));

        setUrgentEmails([]);
        setSilenceOpen(false);
        setSilencePasswordInput('');
        setSilenceError('');
        setPatternNodes([]);
        setMathInput('');
        setFaceScanState('idle');
        
        alert("Priority alarm silenced successfully! Take immediate action on details.");
    };

    const handleSilenceAlarmAttempt = () => {
        if (silencePasswordInput === profile.alarmPassword) {
            silenceAlarmSuccessfully();
        } else {
            setSilenceError("Invalid Stop Passcode!");
        }
    };

    // --- SPEECH VOICE DICTATION WIDGET ---

    const toggleVoiceRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition API is not supported by your browser. Please try typing.");
            return;
        }

        if (speechRecording) {
            // Stop recording
            if (window.speechRecObj) {
                window.speechRecObj.stop();
                window.speechRecObj = null;
            }
            setSpeechRecording(false);
        } else {
            // Start recording
            try {
                const rec = new SpeechRecognition();
                rec.continuous = true;
                rec.interimResults = false;
                rec.lang = 'en-US';

                rec.onstart = () => {
                    setSpeechRecording(true);
                };

                rec.onresult = (e) => {
                    const resultText = e.results[e.results.length - 1][0].transcript;
                    setComposeBody(prev => prev ? prev + ' ' + resultText : resultText);
                };

                rec.onerror = (err) => {
                    console.error("Speech Recognition error: ", err);
                    setSpeechRecording(false);
                };

                rec.onend = () => {
                    setSpeechRecording(false);
                };

                rec.start();
                window.speechRecObj = rec;
            } catch (err) {
                console.error(err);
                setSpeechRecording(false);
            }
        }
    };

    // --- GRAMMARLY & QUILLBOT AI REWRITING ---

    const handleGrammarCheck = () => {
        setGrammarChecked(true);
        // Grammarly simulated scan
        if (composeBody.toLowerCase().includes('write to') || composeBody.includes('recieve') || composeBody.toLowerCase().includes('urgent')) {
            setGrammarErrors([
                { original: 'recieve', correction: 'receive', index: 0 },
                { original: 'i am writing', correction: 'I am writing', index: 1 },
                { original: 'vit', correction: 'VIT', index: 2 }
            ]);
        } else {
            setGrammarErrors([
                { original: 'dont', correction: "don't", index: 0 }
            ]);
        }
    };

    const applyGrammarFix = (err) => {
        const updatedBody = composeBody.replace(err.original, err.correction);
        setComposeBody(updatedBody);
        setGrammarErrors(grammarErrors.filter(e => e.index !== err.index));
    };

    const fixAllGrammar = () => {
        let temp = composeBody;
        grammarErrors.forEach(err => {
            temp = temp.replace(err.original, err.correction);
        });
        setComposeBody(temp);
        setGrammarErrors([]);
    };

    const handleToneChange = (tone) => {
        if (!composeBody) {
            alert("Please write something in the body first, then click rewrite!");
            return;
        }

        // Quillbot simulated rephraser templates
        let rephrased = '';
        if (tone === 'formal') {
            rephrased = `Dear Sir/Madam,\n\nI am writing to formally request your attention regarding my registration records. Kindly let me know the status of verification.\n\nThank you for your assistance.\n\nSincerely,\n${profile.name || 'Akarsh'}`;
        } else if (tone === 'casual') {
            rephrased = `Hey there,\n\nJust checking in about the registration. Let me know if you need any other documents from my side.\n\nThanks,\n${profile.name || 'Akarsh'}`;
        } else if (tone === 'urgent') {
            rephrased = `URGENT ACTION REQUIRED:\n\nHello, this is regarding my academic ID and verification files. Please process this on high priority.\n\nRegards,\n${profile.name || 'Akarsh'}`;
        } else {
            rephrased = `Respected Sir/Madam,\n\nThis is ${profile.name || 'Akarsh'} (ID: ${profile.neoPatId || 'N/A'}). I am writing to query updates regarding course files.\n\nThank you,\n${profile.name}`;
        }
        setComposeBody(rephrased);
    };

    // --- UNDO SEND AND SENT EMAIL STORAGE ---

    const handleSendEmail = (e) => {
        e.preventDefault();
        if (!composeTo || !composeSubject || !composeBody) {
            alert("To, Subject, and Body are required!");
            return;
        }

        const newEmailRecord = {
            id: 'sent_' + Date.now(),
            to: composeTo,
            subject: composeSubject,
            body: composeBody,
            sentTimestamp: Date.now(),
            from: profile.collegeEmail || 'you@gmail.com'
        };

        setPendingUndoEmail(newEmailRecord);
        setComposeOpen(false); // Close composer modal
        
        // Open the 60-second Undo send banner
        setShowUndoBanner(true);
        setUndoCountdown(60);

        if (undoTimerRef.current) clearInterval(undoTimerRef.current);
        
        let counter = 60;
        undoTimerRef.current = setInterval(() => {
            counter -= 1;
            setUndoCountdown(counter);
            if (counter <= 0) {
                clearInterval(undoTimerRef.current);
                commitSendEmail(newEmailRecord);
            }
        }, 1000);
    };

    const handleUndoSend = () => {
        if (undoTimerRef.current) {
            clearInterval(undoTimerRef.current);
        }
        setShowUndoBanner(false);
        
        // Re-open composer with data prefilled
        if (pendingUndoEmail) {
            setComposeTo(pendingUndoEmail.to);
            setComposeSubject(pendingUndoEmail.subject);
            setComposeBody(pendingUndoEmail.body);
            setComposeOpen(true);
        }
        setPendingUndoEmail(null);
        alert("Sending cancelled. You can now edit and resend.");
    };

    const commitSendEmail = (emailObj) => {
        // Save in localStorage sent list
        const sent = JSON.parse(localStorage.getItem('nm_sent_emails') || '[]');
        sent.unshift(emailObj);
        localStorage.setItem('nm_sent_emails', JSON.stringify(sent));
        
        setShowUndoBanner(false);
        setPendingUndoEmail(null);
        loadSentEmails();
        alert("Email sent successfully!");
    };

    // 15-minute Edit and Delete sent emails
    const handleEditSentMail = (mail) => {
        // Remove from sent emails list (we are editing/resending it)
        const updated = sentEmails.filter(s => s.id !== mail.id);
        localStorage.setItem('nm_sent_emails', JSON.stringify(updated));
        setSentEmails(updated);

        // Pre-fill composer
        setComposeTo(mail.to);
        setComposeSubject(mail.subject);
        setComposeBody(mail.body);
        setComposeOpen(true);
        setSelectedEmail(null);

        alert("Email loaded to composer for editing.");
    };

    const handleDeleteSentMail = (mail) => {
        if (confirm("Are you sure you want to delete/recall this email from the recipient outbox? (15m window active)")) {
            const updated = sentEmails.filter(s => s.id !== mail.id);
            localStorage.setItem('nm_sent_emails', JSON.stringify(updated));
            setSentEmails(updated);
            setSelectedEmail(null);
            alert("Email recalled and deleted successfully.");
        }
    };

    // --- Translation & TTS ---
    const handleTranslate = () => {
        if (!selectedEmail) return;
        setTranslateLoading(true);
        setTimeout(() => {
            const mockTrans = {
                hindi: "यह ईमेल आपके महत्वपूर्ण पंजीकरण अपडेट के बारे में है। कृपया तत्काल सत्यापन पूरा करें।",
                tamil: "இந்த மின்னஞ்சல் உங்களது பதிவு புதுப்பித்தல் பற்றியது. தயவுசெய்து உடனடியாக சரிபார்க்கவும்.",
                telugu: "ఈ ఇమెయిల్ మీ నమోదు నవీకరణ గురించి. దయచేసి వెంటనే ధృవీకరించండి.",
                malayalam: "ഈ ഇമെയിൽ നിങ്ങളുടെ രജിസ്ട്രേഷൻ സംബന്ധിച്ചുള്ളതാണ്. ദയവായി ഉടൻ പരിശോധിക്കുക."
            };
            setTranslatedText(mockTrans[translateLang.toLowerCase()] || "Action required on email details immediately.");
            setTranslateLoading(false);
        }, 400);
    };

    const handleSpeak = () => {
        const textToSpeak = translatedText || selectedEmail?.body || selectedEmail?.bodySnippet || "";
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const langCode = {
            hindi: 'hi-IN',
            tamil: 'ta-IN',
            telugu: 'te-IN',
            malayalam: 'ml-IN'
        }[speakLangVoice] || 'en-US';

        utterance.lang = langCode;
        window.speechSynthesis.speak(utterance);
    };

    const handleComposeGenerate = () => {
        if (!composePrompt) {
            alert("Please type a description of what you want to write!");
            return;
        }
        setComposeLoading(true);
        setTimeout(() => {
            setComposeBody(`Subject: [AI Draft] Regarding ${composePrompt}\n\nDear Sir/Madam,\n\nI am writing to notify you that I would like to request details regarding ${composePrompt}.\n\nPlease let me know the appropriate steps to verify.\n\nThank you,\n${profile.name || 'Akarsh'}`);
            if (!composeSubject) {
                setComposeSubject("Regarding: " + composePrompt.substring(0, 30));
            }
            setComposeLoading(false);
        }, 500);
    };

    const handleGptAction = () => {
        setGptLoading(true);
        setTimeout(() => {
            setComposeTo(selectedEmail?.from || '');
            setComposeSubject("Re: " + (selectedEmail?.subject || ''));
            setComposeBody(`Dear ${selectedEmail?.from || 'Recipient'},\n\nI acknowledge receipt of your email regarding "${selectedEmail?.subject}". I will review the documents and confirm shortly.\n\nBest regards,\n${profile.name || 'Akarsh'}`);
            setComposeOpen(true); // Open compose dialog prefilled
            setGptLoading(false);
        }, 500);
    };

    // --- Countdown Helper ---
    const getRemainingTime = (sendAtStr) => {
        const sendAt = new Date(sendAtStr);
        const diffMs = sendAt.getTime() - now.getTime();
        if (diffMs <= 0) return 'Sending...';

        const diffSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Filter Emails by Search / Folder ---
    const filteredEmails = emails.filter(email => {
        if (activeFolder === 'priority' && !email.isUrgent) return false;
        
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
                    <button className="nexmail-hamburger" onClick={fetchEmails}>☰</button>
                    <div className="nexmail-logo">
                        <span>Nex</span><span>Mail</span>
                    </div>
                    <button className="nexmail-hamburger" style={{ fontSize: '16px' }} onClick={checkAlerts}>🔔</button>
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
                    <div 
                        className="nexmail-profile-avatar" 
                        style={{ background: '#8ab4f8', color: '#202124', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        onClick={() => setProfileOpen(true)}
                    >
                        {(profile.name || 'A').charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* Workspace split panes */}
            <div className="nexmail-workspace">
                
                {/* Sidebar */}
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
                            <span className="nexmail-menu-badge blue">{emails.length}</span>
                        </div>
                        <div className={`nexmail-menu-item ${activeFolder === 'priority' ? 'active' : ''}`} onClick={() => { setActiveFolder('priority'); setSelectedEmail(null); }}>
                            <div className="nexmail-menu-item-left">
                                <span>⭐</span> Priority
                            </div>
                            <span className="nexmail-menu-badge red">{emails.filter(e => e.isUrgent).length}</span>
                        </div>
                        <div className={`nexmail-menu-item ${activeFolder === 'drafts' ? 'active' : ''}`} onClick={() => { setActiveFolder('drafts'); setSelectedEmail(null); }}>
                            <div className="nexmail-menu-item-left">
                                <span>📝</span> Drafts / Outbox
                            </div>
                            <span className="nexmail-menu-badge">{pendingEmails.length}</span>
                        </div>
                        <div className={`nexmail-menu-item ${activeFolder === 'sent' ? 'active' : ''}`} onClick={() => { setActiveFolder('sent'); setSelectedEmail(null); }}>
                            <div className="nexmail-menu-item-left">
                                <span>✈️</span> Sent Folder
                            </div>
                            <span className="nexmail-menu-badge blue">{sentEmails.length}</span>
                        </div>
                    </div>

                    <div className="nexmail-menu-section">
                        <div className="nexmail-menu-section-title">Alarm Status</div>
                        <div className="nexmail-menu-item" style={{ color: isAlarmActive ? 'var(--urgent)' : 'inherit', fontWeight: isAlarmActive ? '700' : 'normal' }}>
                            <div className="nexmail-menu-item-left">
                                <span>⚠️</span> Sound Status
                            </div>
                            <span className="nexmail-menu-badge red">{isAlarmActive ? 'RINGING' : 'SILENT'}</span>
                        </div>
                    </div>

                    {/* Synchronized Mobile App Illustration */}
                    <div className="nexmail-mobile-sync-card">
                        <div className="nexmail-mobile-sync-title">Loud Mobile Alarm App</div>
                        <img className="nexmail-mobile-sync-img" src={syncMobileAppImg} alt="Mobile Mockups" />
                    </div>
                </aside>

                {/* Email List Pane */}
                <main className="nexmail-list-pane">
                    <div className="nexmail-list-header">
                        <div className="nexmail-list-header-left">
                            <input type="checkbox" style={{ marginRight: '6px' }} />
                            <span>▼</span>
                            <span style={{ fontSize: '16px', color: '#cbd5e1' }}>|</span>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={fetchEmails}>↻ Refresh</button>
                        </div>
                    </div>

                    <div className="nexmail-emails-container">
                        {activeFolder === 'drafts' && (
                            pendingEmails.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <p>No outgoing mails delayed in recall outbox.</p>
                                </div>
                            ) : (
                                pendingEmails.map(mail => (
                                    <div key={mail.id} className={`nexmail-email-item ${selectedEmail?.id === mail.id ? 'selected' : ''}`} onClick={() => setSelectedEmail(mail)}>
                                        <div className="nexmail-email-item-top">
                                            <span style={{ color: '#8ab4f8' }}>To: {mail.recipientEmail}</span>
                                            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{getRemainingTime(mail.sendAt)}</span>
                                        </div>
                                        <div className="nexmail-email-subject">Pending: {mail.subject}</div>
                                    </div>
                                ))
                            )
                        )}

                        {activeFolder === 'sent' && (
                            sentEmails.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <p>No sent emails in local database history.</p>
                                </div>
                            ) : (
                                sentEmails.map(mail => {
                                    const isEditable = (Date.now() - mail.sentTimestamp) < 15 * 60 * 1000;
                                    return (
                                        <div 
                                            key={mail.id} 
                                            className={`nexmail-email-item ${selectedEmail?.id === mail.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedEmail(mail)}
                                        >
                                            <div className="nexmail-email-item-top">
                                                <span>To: {mail.to}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#9aa0a6' }}>
                                                    {new Date(mail.sentTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="nexmail-email-subject">{mail.subject}</div>
                                            {isEditable && (
                                                <span style={{ fontSize: '0.75rem', background: 'rgba(138, 180, 248, 0.1)', color: '#8ab4f8', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                                                    ✏️ 15m Edit/Recall active
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )
                        )}

                        {activeFolder !== 'drafts' && activeFolder !== 'sent' && (
                            filteredEmails.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <p>No emails found in this mailbox.</p>
                                </div>
                            ) : (
                                filteredEmails.map(email => (
                                    <div key={email.id} className={`nexmail-email-item ${selectedEmail?.id === email.id ? 'selected' : ''} ${email.isUrgent ? 'alarm-triggered' : ''}`} onClick={() => setSelectedEmail(email)}>
                                        <div className="nexmail-email-item-top">
                                            <span>{email.from}</span>
                                            <span>{new Date(email.internalDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="nexmail-email-subject">
                                            {email.subject}
                                            {email.isUrgent && <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold' }}>URGENT ALARM</span>}
                                        </div>
                                        <div className="nexmail-email-snippet">{email.bodySnippet}</div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </main>

                {/* Email Detail & Tools Pane */}
                <section className="nexmail-detail-pane">
                    {selectedEmail ? (
                        <>
                            <div className="nexmail-detail-header">
                                <div className="nexmail-detail-header-left">
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} onClick={() => setSelectedEmail(null)}>←</button>
                                    <h2 className="nexmail-detail-title">{selectedEmail.subject}</h2>
                                </div>
                            </div>

                            <div className="nexmail-detail-body-container">
                                {selectedEmail.isUrgent && isAlarmActive && (
                                    <div className="nexmail-alarm-banner" style={{ background: '#7f1d1d', border: '1px solid #ef4444' }}>
                                        <div><strong>🚨 Priority Alarm Sounding!</strong> Word "URGENT/IMPORTANT" detected.</div>
                                        <button className="chrome-btn-blue-rect" style={{ background: '#ef4444', color: '#fff', padding: '6px 14px', height: '32px' }} onClick={() => setSilenceOpen(true)}>
                                            🛑 Stop Alarm Challenge
                                        </button>
                                    </div>
                                )}

                                <div className="nexmail-sender-profile">
                                    <div className="nexmail-sender-avatar-letter">
                                        {(selectedEmail.from || selectedEmail.recipientEmail || 'P').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="nexmail-sender-details">
                                        <div className="nexmail-sender-name">{selectedEmail.from || `To: ${selectedEmail.recipientEmail || selectedEmail.to}`}</div>
                                        <div className="nexmail-sender-to">to me ▼</div>
                                    </div>
                                </div>

                                <div className="nexmail-email-body-text" style={{ whiteSpace: 'pre-wrap' }}>
                                    {selectedEmail.body || selectedEmail.bodySnippet}
                                </div>

                                {/* Sent mail actions - 15 minute edit window check */}
                                {activeFolder === 'sent' && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                                        { (Date.now() - selectedEmail.sentTimestamp) < 15 * 60 * 1000 ? (
                                            <>
                                                <button className="chrome-btn-blue-rect" onClick={() => handleEditSentMail(selectedEmail)}>
                                                    ✏️ Edit Sent Mail (15m window)
                                                </button>
                                                <button className="chrome-btn-dark" style={{ borderColor: '#ef4444', color: '#f87171' }} onClick={() => handleDeleteSentMail(selectedEmail)}>
                                                    🗑️ Recall & Delete
                                                </button>
                                            </>
                                        ) : (
                                            <p style={{ fontSize: '0.8rem', color: '#9aa0a6' }}>🔒 15-minute edit/recall window has expired.</p>
                                        )}
                                    </div>
                                )}

                                {/* Tools panel for translation and assistance */}
                                <div className="nexmail-tools-section">
                                    <div className="nexmail-tools-grid">
                                        <div className="nexmail-tool-card">
                                            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Translate & TTS</div>
                                            <select className="nexmail-tool-select" value={translateLang} onChange={(e) => setTranslateLang(e.target.value)}>
                                                <option value="hindi">Hindi</option>
                                                <option value="tamil">Tamil</option>
                                                <option value="telugu">Telugu</option>
                                                <option value="malayalam">Malayalam</option>
                                            </select>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                <button className="chrome-btn-blue-rect" style={{ height: '32px', flex: 1 }} onClick={handleTranslate}>TRANSLATE</button>
                                                <button className="chrome-btn-dark" style={{ height: '32px', flex: 1 }} onClick={handleSpeak}>🔊 LISTEN</button>
                                            </div>
                                            <textarea className="nexmail-tool-textarea" value={translatedText} placeholder="Translation details..." readOnly />
                                        </div>

                                        <div className="nexmail-tool-card">
                                            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Mail GPT Assistant</div>
                                            <div className="nexmail-gpt-options">
                                                {['Summarize Mail', 'Draft Reply: Acknowledge', 'Request Details'].map(o => (
                                                    <button key={o} className="chrome-btn-dark" style={{ height: '28px', fontSize: '11px', padding: '0 8px', width: '100%', textAlign: 'left', marginBottom: '4px' }} onClick={() => { setGptPrompt(o); handleGptAction(); }}>
                                                        {o}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', height: '100%' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
                            <p>Select an email to view details and use intelligent tool assistants.</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Undo Send Banner (60 seconds countdown) */}
            {showUndoBanner && pendingUndoEmail && (
                <div className="undo-send-banner">
                    <span>Email sending to <strong>{pendingUndoEmail.to}</strong> (will send in {undoCountdown}s)...</span>
                    <button className="undo-send-btn" onClick={handleUndoSend}>
                        ↩️ UNDO SEND
                    </button>
                </div>
            )}

            {/* Modals */}

            {/* 1. Compose Modal with AI Composer Panel */}
            {composeOpen && (
                <div className="nexmail-compose-modal-overlay">
                    <div className="nexmail-compose-modal" style={{ maxWidth: '650px', background: '#202124', color: '#e8eaed', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="nexmail-compose-modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <span>🤖 Compose with AI Assistant</span>
                            <button className="nexmail-modal-close-btn" onClick={() => setComposeOpen(false)} style={{ color: '#fff' }}>×</button>
                        </div>
                        
                        <div className="nexmail-compose-modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                            <div className="nexmail-form-group">
                                <label style={{ color: '#8ab4f8', fontSize: '0.8rem', fontWeight: 'bold' }}>To (Recipient Email)</label>
                                <input type="text" className="nexmail-form-input" style={{ background: '#28292c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="e.g. boss.office@gmail.com" />
                            </div>
                            <div className="nexmail-form-group">
                                <label style={{ color: '#8ab4f8', fontSize: '0.8rem', fontWeight: 'bold' }}>Subject</label>
                                <input type="text" className="nexmail-form-input" style={{ background: '#28292c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Enter email subject" />
                            </div>

                            {/* Toggle AI Panel */}
                            <button 
                                type="button" 
                                className="chrome-btn-dark"
                                style={{ margin: '8px 0', width: '100%', borderColor: '#8ab4f8', color: '#8ab4f8', background: aiPanelOpen ? 'rgba(138, 180, 248, 0.08)' : 'transparent' }}
                                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                            >
                                {aiPanelOpen ? '⚡ Close AI Writing Assistant' : '⚡ Open AI Writing Assistant & Voice Dictation'}
                            </button>

                            {aiPanelOpen && (
                                <div className="ai-composer-panel">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
                                        {/* Column A: Voice Dictation */}
                                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', color: '#e8eaed', textAlign: 'center' }}>
                                                Voice Writing ("Speak it, we will write")
                                            </div>
                                            <button 
                                                type="button" 
                                                className={`voice-pulse-btn ${speechRecording ? 'recording' : ''}`}
                                                onClick={toggleVoiceRecording}
                                            >
                                                🎙️
                                            </button>
                                            <span style={{ fontSize: '0.75rem', color: speechRecording ? '#f87171' : '#9aa0a6', marginTop: '6px', textAlign: 'center' }}>
                                                {speechRecording ? 'Recording voice... Click to stop.' : 'Click to start speaking'}
                                            </span>
                                        </div>

                                        {/* Column B: Prompt Writer */}
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '6px', color: '#e8eaed' }}>
                                                Prompt Writer ("Give us details")
                                            </div>
                                            <textarea 
                                                className="nexmail-form-input" 
                                                rows={2} 
                                                style={{ background: '#28292c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', padding: '8px' }}
                                                placeholder="Write draft about e.g. sick leave application..."
                                                value={composePrompt}
                                                onChange={(e) => setComposePrompt(e.target.value)}
                                            />
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                                <select className="chrome-select" style={{ height: '32px', padding: '0 8px', fontSize: '0.8rem', flex: 1 }} value={composeTone} onChange={(e) => setComposeTone(e.target.value)}>
                                                    <option value="formal">Formal</option>
                                                    <option value="semi-formal">Semi-Formal</option>
                                                    <option value="polite">Polite</option>
                                                </select>
                                                <button type="button" className="chrome-btn-blue-rect" style={{ height: '32px', fontSize: '0.8rem' }} onClick={handleComposeGenerate} disabled={composeLoading}>
                                                    {composeLoading ? 'Drafting...' : '🤖 Draft Email'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tone modifier (Quillbot-like) & Grammar Scanner (Grammarly-like) */}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', marginTop: '8px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', color: '#e8eaed' }}>
                                            Quillbot & Grammarly Helpers:
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                            <button type="button" className="chrome-btn-dark" style={{ height: '28px', fontSize: '0.8rem', padding: '0 10px' }} onClick={() => handleToneChange('formal')}>👔 Professional Tone</button>
                                            <button type="button" className="chrome-btn-dark" style={{ height: '28px', fontSize: '0.8rem', padding: '0 10px' }} onClick={() => handleToneChange('casual')}>💬 Casual Tone</button>
                                            <button type="button" className="chrome-btn-dark" style={{ height: '28px', fontSize: '0.8rem', padding: '0 10px' }} onClick={() => handleToneChange('urgent')}>🚨 Urgent Tone</button>
                                            <button type="button" className="chrome-btn-blue-rect" style={{ height: '28px', fontSize: '0.8rem', padding: '0 12px', background: '#319795', color: '#fff' }} onClick={handleGrammarCheck}>
                                                🔍 Grammarly Grammar Check
                                            </button>
                                        </div>

                                        {grammarChecked && (
                                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f87171', marginBottom: '6px' }}>Grammar highlights:</div>
                                                {grammarErrors.length === 0 ? (
                                                    <p style={{ fontSize: '0.75rem', color: '#81c995' }}>✓ Grammarly scan completed. Zero errors found!</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {grammarErrors.map((err, i) => (
                                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.05)', padding: '6px 10px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                                <span>Change <span style={{ textDecoration: 'line-through', color: '#f87171' }}>"{err.original}"</span> to <strong style={{ color: '#81c995' }}>"{err.correction}"</strong></span>
                                                                <button type="button" style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#8ab4f8', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }} onClick={() => applyGrammarFix(err)}>Apply</button>
                                                            </div>
                                                        ))}
                                                        <button type="button" className="chrome-btn-blue-rect" style={{ height: '26px', fontSize: '0.75rem', marginTop: '6px', background: '#81c995', color: '#202124' }} onClick={fixAllGrammar}>
                                                            Apply All Corrections
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="nexmail-form-group">
                                <label style={{ color: '#8ab4f8', fontSize: '0.8rem', fontWeight: 'bold' }}>Email Body</label>
                                <textarea className="nexmail-form-textarea" style={{ background: '#28292c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} rows={10} value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Type body details or dictation here..." />
                            </div>
                        </div>

                        <div className="nexmail-compose-modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <button className="chrome-btn-dark" onClick={() => setComposeOpen(false)}>Cancel</button>
                            <button className="chrome-btn-blue-rect" onClick={handleSendEmail}>🚀 Send Email</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Rules / Profile Filters Settings Modal */}
            {profileOpen && (
                <div className="nexmail-profile-modal-overlay">
                    <div className="nexmail-compose-modal" style={{ width: '500px', background: '#202124', color: '#e8eaed', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="nexmail-compose-modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <span>⚙️ Smart Alarm Filter & Parameters</span>
                            <button className="nexmail-modal-close-btn" onClick={() => setProfileOpen(false)} style={{ color: '#fff' }}>×</button>
                        </div>

                        <div className="nexmail-compose-modal-body">
                            <div className="nexmail-form-group">
                                <label style={{ color: '#8ab4f8', fontSize: '0.8rem', fontWeight: 'bold' }}>Your Full Name</label>
                                <input type="text" className="nexmail-form-input" style={{ background: '#28292c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="nexmail-form-group">
                                    <label style={{ color: '#8ab4f8', fontSize: '0.8rem', fontWeight: 'bold' }}>College / Work Email</label>
                                    <input type="email" className="nexmail-form-input" style={{ background: '#28292c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={profile.collegeEmail} onChange={e => setProfile({ ...profile, collegeEmail: e.target.value })} />
                                </div>
                                <div className="nexmail-form-group">
                                    <label style={{ color: '#8ab4f8', fontSize: '0.8rem', fontWeight: 'bold' }}>Employee / Student ID Number</label>
                                    <input type="text" className="nexmail-form-input" style={{ background: '#28292c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={profile.neoPatId} onChange={e => setProfile({ ...profile, neoPatId: e.target.value })} />
                                </div>
                            </div>

                            <div className="nexmail-form-group">
                                <label style={{ color: '#8ab4f8', fontSize: '0.8rem', fontWeight: 'bold' }}>Alarm Silencing Stop Password</label>
                                <input type="text" className="nexmail-form-input" style={{ background: '#28292c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={profile.alarmPassword} onChange={e => setProfile({ ...profile, alarmPassword: e.target.value })} />
                            </div>
                        </div>

                        <div className="nexmail-compose-modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <button className="chrome-btn-dark" onClick={() => setProfileOpen(false)}>Cancel</button>
                            <button className="chrome-btn-blue-rect" onClick={saveProfile}>Save Settings</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Loud Fullscreen Silence Alarm Challenges Overlay */}
            {silenceOpen && (
                <div className="alarm-loud-overlay">
                    <div className="alarm-flashing-card">
                        <div className="alarm-glowing-bell">🔔</div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444', letterSpacing: '-0.5px' }}>
                            URGENT INCOMING ALARM ALERT!
                        </h2>
                        
                        {urgentEmails.length > 0 && (
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', width: '100%' }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fca5a5' }}>
                                    Subject: {urgentEmails[0].subject}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#9aa0a6', marginTop: '6px' }}>
                                    From: {urgentEmails[0].from}
                                </div>
                            </div>
                        )}

                        <p style={{ fontSize: '0.85rem', color: '#9aa0a6' }}>
                            This email has been flagged as critical. Solve one of the following challenges to stop the alarm.
                        </p>

                        {/* Challenges selector nav bar */}
                        <div className="alarm-challenge-nav">
                            <button type="button" className={`alarm-challenge-btn ${activeAlarmChallenge === 'passcode' ? 'active' : ''}`} onClick={() => { setActiveAlarmChallenge('passcode'); stopCamera(); }}>
                                <span>🔑</span> Passcode
                            </button>
                            <button type="button" className={`alarm-challenge-btn ${activeAlarmChallenge === 'pattern' ? 'active' : ''}`} onClick={() => { setActiveAlarmChallenge('pattern'); setPatternNodes([]); stopCamera(); }}>
                                <span>✏️</span> Pattern
                            </button>
                            <button type="button" className={`alarm-challenge-btn ${activeAlarmChallenge === 'math' ? 'active' : ''}`} onClick={() => { setActiveAlarmChallenge('math'); generateMathQuestion(); stopCamera(); }}>
                                <span>🧮</span> Math Puzzle
                            </button>
                            <button type="button" className={`alarm-challenge-btn ${activeAlarmChallenge === 'face' ? 'active' : ''}`} onClick={() => { setActiveAlarmChallenge('face'); startCamera(); }}>
                                <span>👤</span> Face ID
                            </button>
                        </div>

                        {/* Active Stop Challenge Body */}
                        <div className="alarm-active-challenge-box">
                            {activeAlarmChallenge === 'passcode' && (
                                <div style={{ width: '100%' }}>
                                    <div className="chrome-input-group">
                                        <input
                                            type="password"
                                            id="alarmPasscode"
                                            className="chrome-input"
                                            style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
                                            placeholder=" "
                                            value={silencePasswordInput}
                                            onChange={(e) => setSilencePasswordInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSilenceAlarmAttempt()}
                                        />
                                        <label htmlFor="alarmPasscode" className="chrome-label">Enter Silencing Password</label>
                                    </div>
                                    {silenceError && <p style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '6px', fontWeight: 'bold' }}>⚠️ {silenceError}</p>}
                                    <button type="button" className="chrome-btn-blue-rect" style={{ width: '100%', marginTop: '16px', background: '#ef4444', color: '#fff' }} onClick={handleSilenceAlarmAttempt}>
                                        Verify & Stop Alarm
                                    </button>
                                </div>
                            )}

                            {activeAlarmChallenge === 'pattern' && (
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#9aa0a6', marginBottom: '12px' }}>
                                        Draw pattern (Click dots in sequence. Sequence length: {patternNodes.length}/4)
                                    </div>
                                    <div className="pattern-lock-board">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                            <div 
                                                key={num}
                                                className={`pattern-lock-node ${patternNodes.includes(num) ? 'selected' : ''}`}
                                                onClick={() => handlePatternClick(num)}
                                            >
                                                {patternNodes.indexOf(num) !== -1 ? patternNodes.indexOf(num) + 1 : ''}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                        <button type="button" className="chrome-btn-dark" onClick={() => setPatternNodes([])}>Reset</button>
                                        <button type="button" className="chrome-btn-blue-rect" onClick={verifyPattern}>Verify Grid Pattern</button>
                                    </div>
                                </div>
                            )}

                            {activeAlarmChallenge === 'math' && (
                                <form onSubmit={verifyMath} style={{ width: '100%' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', marginBottom: '14px' }}>
                                        What is {mathQuestion.text}?
                                    </div>
                                    <div className="chrome-input-group">
                                        <input
                                            type="text"
                                            id="mathAns"
                                            className="chrome-input"
                                            placeholder=" "
                                            value={mathInput}
                                            onChange={(e) => setMathInput(e.target.value.replace(/[^0-9-]/g, ''))}
                                            required
                                        />
                                        <label htmlFor="mathAns" className="chrome-label">Enter Answer</label>
                                    </div>
                                    <button type="submit" className="chrome-btn-blue-rect" style={{ width: '100%', marginTop: '16px' }}>
                                        Verify Math Solution
                                    </button>
                                </form>
                            )}

                            {activeAlarmChallenge === 'face' && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div className="face-scanner-camera-feed">
                                        <video 
                                            ref={videoRef} 
                                            autoPlay 
                                            playsInline 
                                            muted 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        {/* Scan overlay line */}
                                        <div className="face-scanner-radar-line"></div>
                                    </div>
                                    
                                    <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#8ab4f8', fontWeight: 'bold' }}>
                                        {faceScanState === 'scanning' && '🔄 Scanning Face... Stay still'}
                                        {faceScanState === 'success' && '✓ Scan Match 99.1% - Face Verified!'}
                                        {faceScanState === 'idle' && '👤 Biometric Scan Ready'}
                                    </div>
                                    {faceScanState === 'idle' && (
                                        <button type="button" className="chrome-btn-blue-rect" style={{ marginTop: '12px' }} onClick={startCamera}>
                                            Start Camera Recognition
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
