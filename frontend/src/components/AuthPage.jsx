import React, { useState } from 'react';

const AuthPage = ({ onLoginSuccess, navigateTo }) => {
  const [loginStep, setLoginStep] = useState(1); // 1: Email, 2: Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleEmailNext = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Check if email exists in simulated database
    const users = JSON.parse(localStorage.getItem('nm_registered_users') || '[]');
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (userExists) {
      setLoginStep(2);
    } else {
      setErrorMsg('Account not found. Click "Create account" to sign up, or click "Google Workspace" / "Demo Sign-in" below.');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('nm_registered_users') || '[]');
    const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (matchedUser) {
      if (matchedUser.password === password) {
        setSuccessMsg('Login successful! Loading dashboard...');
        
        // Save current active session
        localStorage.setItem('nm_current_user', JSON.stringify(matchedUser));
        
        setTimeout(() => {
          onLoginSuccess(matchedUser);
        }, 1000);
      } else {
        setErrorMsg('Wrong password. Try again or click Forgot password to reset it.');
      }
    } else {
      setErrorMsg('An unexpected error occurred. Please restart the sign-in.');
    }
  };

  const handleGoogleSignIn = () => {
    // Redirection to Spring Boot OAuth2 endpoint to connect to real Google IDs
    window.location.href = '/oauth2/authorization/google';
  };

  const handleDemoSignIn = () => {
    const demoUser = {
      email: 'demo.student@gmail.com',
      name: 'Demo Student',
      regNo: 'REG123456',
      collegeEmail: 'demo.student@gmail.com',
      neoPatId: 'NP998877',
      alarmPassword: 'STOP',
      alarmTone: 'emergency'
    };
    
    const users = JSON.parse(localStorage.getItem('nm_registered_users') || '[]');
    if (!users.some(u => u.email.toLowerCase() === demoUser.email.toLowerCase())) {
      users.push(demoUser);
      localStorage.setItem('nm_registered_users', JSON.stringify(users));
    }
    
    localStorage.setItem('nm_current_user', JSON.stringify(demoUser));
    setSuccessMsg('Demo Login successful! Redirecting...');
    
    setTimeout(() => {
      onLoginSuccess(demoUser);
    }, 1000);
  };

  const handleBack = () => {
    if (loginStep === 2) {
      setLoginStep(1);
      setErrorMsg('');
    } else {
      navigateTo('setup-profile');
    }
  };

  return (
    <div className="chrome-layout-bg">
      {/* Back Button */}
      <button className="chrome-back-btn" onClick={handleBack} title="Back">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>

      {/* Floating background shapes */}
      <div className="chrome-shape chrome-shape-blue"></div>
      <div className="chrome-shape chrome-shape-red"></div>
      <div className="chrome-shape chrome-shape-yellow"></div>
      <div className="chrome-shape chrome-shape-green"></div>

      <div className="chrome-split-card">
        {/* Left Side */}
        <div className="chrome-card-left">
          <div className="chrome-google-logo">
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <span className="chrome-google-logo-text">NexMail</span>
          </div>

          {loginStep === 1 ? (
            <>
              <h2 className="chrome-card-title">Sign in to NexMail</h2>
              <p className="chrome-card-subtitle">Use your NexMail or Gmail Account to access your college dashboard</p>
            </>
          ) : (
            <>
              <h2 className="chrome-card-title">Welcome</h2>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: '16px', 
                  padding: '4px 12px',
                  marginTop: '12px'
                }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#8ab4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#202124', fontWeight: 'bold' }}>
                  {email.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', color: '#e8eaed' }}>{email}</span>
              </div>
            </>
          )}
        </div>

        {/* Right Side */}
        <div className="chrome-card-right">
          {errorMsg && (
            <div className="nm-status-badge error" style={{ width: '100%', marginBottom: '16px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="nm-status-badge success" style={{ width: '100%', marginBottom: '16px' }}>
              ✓ {successMsg}
            </div>
          )}

          {loginStep === 1 ? (
            /* EMAIL INPUT STEP */
            <form className="chrome-form-container" onSubmit={handleEmailNext}>
              <div className="chrome-input-group">
                <input
                  type="text"
                  id="emailInput"
                  className={`chrome-input ${errorMsg && !email ? 'chrome-input-error' : ''}`}
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <label htmlFor="emailInput" className="chrome-label">Email address</label>
              </div>

              <button 
                type="button" 
                className="chrome-link-btn" 
                onClick={() => navigateTo('forgot-email')}
              >
                Forgot email?
              </button>

              <div style={{ fontSize: '0.85rem', color: '#9aa0a6', lineHeight: '1.4', marginTop: '10px' }}>
                Not your computer? Use a Guest window to sign in privately.
              </div>

              {/* Social Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="chrome-btn-dark" 
                  onClick={handleGoogleSignIn} 
                  style={{ borderRadius: '8px', height: '44px', gap: '10px' }}
                >
                  <svg className="nm-btn-social-icon" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15.02 1 12 1 7.28 1 3.25 3.72 1.34 7.69l3.87 3C6.13 7.8 8.85 5.04 12 5.04z"/>
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.48c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.48-4.97 3.48-8.63z"/>
                    <path fill="#FBBC05" d="M5.21 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31L1.34 6.69C.49 8.39 0 10.14 0 12s.49 3.61 1.34 5.31l3.87-3z"/>
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.03.69-2.35 1.1-4.23 1.1-3.15 0-5.87-2.76-6.79-5.65l-3.87 3C3.25 20.28 7.28 23 12 23z"/>
                  </svg>
                  Sign in with Google Workspace
                </button>
                <button type="button" className="chrome-btn-dark" onClick={handleDemoSignIn} style={{ borderRadius: '8px', height: '44px', borderStyle: 'dashed' }}>
                  ⚡ Fast Demo Sign-In
                </button>
              </div>

              {/* Action Buttons */}
              <div className="chrome-card-footer">
                <div>
                  <button 
                    type="button" 
                    className="chrome-btn-text-only" 
                    onClick={() => navigateTo('create-name')}
                  >
                    Create account
                  </button>
                </div>
                <div>
                  <button type="submit" className="chrome-btn-blue-rect">Next</button>
                </div>
              </div>
            </form>
          ) : (
            /* PASSWORD INPUT STEP */
            <form className="chrome-form-container" onSubmit={handlePasswordSubmit}>
              <div className="chrome-input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  id="passwordInput"
                  className={`chrome-input ${errorMsg ? 'chrome-input-error' : ''}`}
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
                <label htmlFor="passwordInput" className="chrome-label">Enter your password</label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  id="showPasswordCheck"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="showPasswordCheck" style={{ cursor: 'pointer', color: '#e8eaed' }}>Show password</label>
              </div>

              {/* Action Buttons */}
              <div className="chrome-card-footer" style={{ marginTop: '48px' }}>
                <div>
                  <button 
                    type="button" 
                    className="chrome-btn-text-only" 
                    onClick={() => navigateTo('forgot-password')}
                  >
                    Forgot password?
                  </button>
                </div>
                <div>
                  <button type="submit" className="chrome-btn-blue-rect">Sign in</button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Chrome Style Footer */}
      <div className="chrome-footer-row">
        <div>
          <span style={{ fontSize: '0.75rem' }}>English (United States)</span>
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

export default AuthPage;
