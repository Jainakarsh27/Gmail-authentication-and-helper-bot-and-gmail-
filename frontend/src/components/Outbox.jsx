import React, { useState, useEffect } from 'react';

const Outbox = ({ pendingEmails, onRefresh }) => {
    const [editingMail, setEditingMail] = useState(null);
    const [editTo, setEditTo] = useState('');
    const [editSubject, setEditSubject] = useState('');
    const [editBody, setEditBody] = useState('');
    const [now, setNow] = useState(new Date());

    // Update current time every second for live ticking countdowns
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getRemainingTime = (sendAtStr) => {
        const sendAt = new Date(sendAtStr);
        const diffMs = sendAt.getTime() - now.getTime();
        if (diffMs <= 0) return 'Sending...';

        const diffSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRecall = async (id) => {
        if (!confirm("Are you sure you want to recall and delete this email? This action cannot be undone.")) {
            return;
        }
        try {
            const response = await fetch(`/api/emails/pending/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert("Email recalled and deleted successfully.");
                onRefresh();
            } else {
                alert("Failed to recall email.");
            }
        } catch (error) {
            console.error("Failed to recall email:", error);
        }
    };

    const startEdit = (mail) => {
        setEditingMail(mail);
        setEditTo(mail.recipientEmail);
        setEditSubject(mail.subject);
        setEditBody(mail.body);
    };

    const handleSaveEdit = async () => {
        if (!editTo || !editSubject || !editBody) {
            alert("All fields are required!");
            return;
        }
        try {
            const response = await fetch(`/api/emails/pending/${editingMail.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: editTo, subject: editSubject, body: editBody })
            });
            if (response.ok) {
                alert("Email draft updated successfully!");
                setEditingMail(null);
                onRefresh();
            } else {
                alert("Failed to update email.");
            }
        } catch (error) {
            console.error("Failed to update email:", error);
        }
    };

    return (
        <section className="glass-card p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    📤 Smart Outbox <span className="text-xs bg-indigo-500/20 text-indigo-300 py-1 px-2.5 rounded-full border border-indigo-500/30">15m Recall Buffer</span>
                </h2>
                <button className="text-sm text-indigo-400 font-semibold" onClick={onRefresh}>Sync</button>
            </div>

            {pendingEmails.length === 0 ? (
                <div className="p-12 text-center text-slate-500 border border-dashed border-white/5 rounded-2xl bg-white/2">
                    <div className="text-4xl mb-4">📤</div>
                    <p>No pending outgoing emails.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {pendingEmails.map(mail => {
                        const remaining = getRemainingTime(mail.sendAt);
                        return (
                            <div key={mail.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-500 uppercase tracking-widest">Recipient</span>
                                        <span className="text-sm font-bold text-indigo-300">{mail.recipientEmail}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-slate-500 uppercase tracking-widest">Sending In</span>
                                        <span className="text-sm font-mono font-black text-amber-400 animate-pulse">{remaining}</span>
                                    </div>
                                </div>
                                
                                <h3 className="text-md font-semibold mb-2">{mail.subject}</h3>
                                <p className="text-sm text-slate-400 line-clamp-2 mb-4 whitespace-pre-wrap">{mail.body}</p>

                                <div className="flex gap-3">
                                    <button 
                                        className="btn-premium py-1.5 px-4 text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 !text-white"
                                        onClick={() => startEdit(mail)}
                                        disabled={remaining === 'Sending...'}
                                    >
                                        ✏️ Edit Draft
                                    </button>
                                    <button 
                                        className="btn-premium py-1.5 px-4 text-xs font-bold bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 !text-red-200"
                                        onClick={() => handleRecall(mail.id)}
                                    >
                                        🛑 Recall (Delete)
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Editing Dialog Modal */}
            {editingMail && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal-content glass-card p-8 max-w-lg w-full">
                        <h3 className="text-xl font-bold mb-6">✏️ Edit Pending Email</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-slate-500 font-bold uppercase">To</label>
                                <input
                                    className="input-premium"
                                    value={editTo}
                                    onChange={(e) => setEditTo(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-slate-500 font-bold uppercase">Subject</label>
                                <input
                                    className="input-premium"
                                    value={editSubject}
                                    onChange={(e) => setEditSubject(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-slate-500 font-bold uppercase">Body</label>
                                <textarea
                                    className="input-premium font-mono text-sm"
                                    rows={8}
                                    value={editBody}
                                    onChange={(e) => setEditBody(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button className="btn-premium flex-1" onClick={handleSaveEdit}>Save Changes</button>
                                <button className="btn-premium flex-1 !bg-slate-700" onClick={() => setEditingMail(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                    <style jsx>{`
                        .edit-modal-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            background: rgba(0, 0, 0, 0.85);
                            backdrop-filter: blur(10px);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 10000;
                            padding: 20px;
                        }
                    `}</style>
                </div>
            )}
        </section>
    );
};

export default Outbox;
