import React, { useState, useEffect } from 'react';
import { playAlarmSound, ALARM_TONES } from '../services/AlarmService';

const AlarmBanner = ({ urgentEmails, stopPassword, onClear }) => {
  const [activeAudio, setActiveAudio] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedTone, setSelectedTone] = useState(ALARM_TONES.emergency);
  const [error, setError] = useState('');

  // Auto-play when urgent emails arrive
  useEffect(() => {
    if (urgentEmails.length > 0 && !activeAudio) {
      const audio = playAlarmSound(selectedTone);
      setActiveAudio(audio);
    }
  }, [urgentEmails]);

  // Handle tone change while alarm is active
  const handleToneChange = (newTone) => {
    setSelectedTone(newTone);
    if (activeAudio) {
      activeAudio.pause();
      const audio = playAlarmSound(newTone);
      setActiveAudio(audio);
    }
  };

  const handleStopAttempt = () => {
    if (passwordInput === stopPassword) {
      if (activeAudio) {
        activeAudio.pause();
        setActiveAudio(null);
      }
      setPasswordInput('');
      setError('');
      onClear();
    } else {
      setError('Incorrect Password! Alarm persistent.');
    }
  };

  if (urgentEmails.length === 0) return null;

  return (
    <div className="alarm-banner animate-fade-in">
      <div className="alarm-content glass-card p-10 max-w-md w-full" style={{ background: 'rgba(13, 13, 26, 0.95)', borderColor: 'rgba(255, 0, 0, 0.5)', boxShadow: '0 0 50px rgba(255, 0, 0, 0.3)' }}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🚨</div>
          <h2 className="text-3xl font-black tracking-tighter text-white mb-2">URGENT ALERT!</h2>
          <p className="text-red-400 font-bold uppercase tracking-widest text-xs">Action Required</p>
        </div>

        <div className="flex flex-col gap-3 mb-8 max-h-40 overflow-y-auto pr-2">
          {urgentEmails.map(email => (
            <div key={email.id} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-xs font-bold text-red-400 uppercase tracking-tighter">{email.from}</span>
              <p className="text-sm font-medium text-white truncate">{email.subject}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-500 font-bold uppercase">Select Alarm Tone</label>
            <select
              className="input-premium bg-slate-900 border-red-500/30 text-white"
              value={selectedTone}
              onChange={(e) => handleToneChange(e.target.value)}
            >
              <option value={ALARM_TONES.emergency}>🚨 Emergency Siren</option>
              <option value={ALARM_TONES.siren}>🔊 Police Siren</option>
              <option value={ALARM_TONES.beep}>⚠️ Warning Beeps</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-500 font-bold uppercase">Enter Stop Password</label>
            <input
              type="password"
              className={`input-premium text-center tracking-widest ${error ? 'border-red-500 bg-red-500/10' : ''}`}
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStopAttempt()}
            />
            {error && <p className="text-xs text-red-500 font-bold text-center mt-1">{error}</p>}
          </div>

          <button
            onClick={handleStopAttempt}
            className="btn-premium w-full !bg-red-600 hover:!bg-red-700 !text-white !font-black !py-4 !text-lg shadow-[0_4px_20px_rgba(220,38,38,0.5)]"
          >
            STOP PERSISTENT ALARM
          </button>

          <p className="text-[10px] text-slate-600 text-center uppercase tracking-tighter mt-2">
            Snooze disabled • Password entry required to terminate
          </p>
        </div>
      </div>
      <style jsx>{`
        .alarm-banner {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }
        .truncate {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default AlarmBanner;
