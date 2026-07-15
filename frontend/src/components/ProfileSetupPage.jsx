import React, { useState } from 'react';

const ProfileSetupPage = ({ navigateTo, onLoginSuccess }) => {
  const [showGuestBanner, setShowGuestBanner] = useState(false);

  const handleStaySignedOut = () => {
    // Show banner notice and stay logout without redirecting
    setShowGuestBanner(true);
    setTimeout(() => {
      setShowGuestBanner(false);
    }, 6000);
  };

  return (
    <div className="chrome-layout-bg">
      {showGuestBanner && (
        <div style={{
          position: 'absolute',
          top: '20px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: '500',
          zIndex: 1000,
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease'
        }}>
          ⚠️ Signed-out Guest Mode: Please Sign In to access email features.
        </div>
      )}

      {/* Decorative floating shapes to match Chrome setup screen */}
      <div className="chrome-shape chrome-shape-blue"></div>
      <div className="chrome-shape chrome-shape-red"></div>
      <div className="chrome-shape chrome-shape-yellow"></div>
      <div className="chrome-shape chrome-shape-green"></div>
      <div className="chrome-shape chrome-shape-grey-left"></div>
      <div className="chrome-shape chrome-shape-grey-right"></div>

      <div className="chrome-setup-center">
        {/* Profile Avatar Icon */}
        <div className="chrome-setup-avatar">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z" />
          </svg>
        </div>

        <h1 className="chrome-setup-title">Set up your new NexMail profile</h1>
        <p className="chrome-setup-subtitle">
          Sign in to sync your academic emails, priorities, course alerts, and automated alarms on all your devices.
        </p>

        <div className="chrome-setup-buttons">
          <button 
            className="chrome-btn-blue" 
            onClick={() => navigateTo('login')}
          >
            Sign in
          </button>
          
          <button 
            className="chrome-btn-dark" 
            onClick={handleStaySignedOut}
          >
            Stay signed out
          </button>
        </div>

        {/* Managed Notice Box */}
        <div className="chrome-setup-notice">
          <div className="chrome-setup-notice-icon">🏢</div>
          <div className="chrome-setup-notice-text">
            Your device is managed by your university organization. Academic administrators can synchronize high-priority exam alerts and deadline details directly into your profile.
          </div>
        </div>
      </div>

      {/* Chrome Style Footer */}
      <div className="chrome-footer-row">
        <div>
          <select className="chrome-lang-select" defaultValue="en-US">
            <option value="en-US">English (United States)</option>
            <option value="en-GB">English (United Kingdom)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <div className="chrome-footer-links">
          <span className="chrome-footer-link">Help</span>
          <span className="chrome-footer-link">Privacy</span>
          <span className="chrome-footer-link">Terms</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
