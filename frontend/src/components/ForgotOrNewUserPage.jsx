import React, { useState, useEffect } from 'react';

const ForgotOrNewUserPage = ({ mode = 'forgot', onOnboardingComplete, navigateTo }) => {
  const [activeMode, setActiveMode] = useState(mode); // 'forgot' | 'new-user' | 'forgot-email'
  
  // Forgot Password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: Reset Form

  // Forgot Email fields
  const [recoveryContact, setRecoveryContact] = useState('');
  const [recoveryFirstName, setRecoveryFirstName] = useState('');
  const [recoveryLastName, setRecoveryLastName] = useState('');
  const [foundEmails, setFoundEmails] = useState([]);
  const [forgotEmailStep, setForgotEmailStep] = useState(1); // 1: Contact, 2: Name, 3: Success

  // New User Onboarding fields
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [neoPatId, setNeoPatId] = useState('');
  const [alarmPassword, setAlarmPassword] = useState('STOP');
  const [alarmTone, setAlarmTone] = useState('emergency');

  // Status message
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync mode state with props
  useEffect(() => {
    setActiveMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
  }, [mode]);

  // Load existing email from registration session if available
  useEffect(() => {
    if (activeMode === 'new-user') {
      const currentUser = JSON.parse(localStorage.getItem('nm_current_user') || '{}');
      if (currentUser.email) {
        setCollegeEmail(currentUser.email);
      }
      if (currentUser.name) {
        setName(currentUser.name);
      }
    }
  }, [activeMode]);

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (resetStep === 1) {
      if (!forgotEmail) {
        setErrorMsg('Please enter your registered email address.');
        return;
      }

      // Check if email exists in simulated user list
      const users = JSON.parse(localStorage.getItem('nm_registered_users') || '[]');
      const userExists = users.some(u => u.email.toLowerCase() === forgotEmail.toLowerCase());

      if (!userExists) {
        setErrorMsg('No account found with this email.');
        return;
      }

      setSuccessMsg('A security password reset code has been sent to ' + forgotEmail);
      setResetCode('123456'); // Simulated code
      
      setTimeout(() => {
        setResetStep(2);
        setSuccessMsg('');
      }, 1500);
    } else {
      if (!newPassword || !confirmPassword) {
        setErrorMsg('Please fill in all password fields.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      if (newPassword.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }

      // Update in simulated database
      const users = JSON.parse(localStorage.getItem('nm_registered_users') || '[]');
      const userIndex = users.findIndex(u => u.email.toLowerCase() === forgotEmail.toLowerCase());

      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('nm_registered_users', JSON.stringify(users));
      }

      setSuccessMsg('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigateTo('login');
      }, 1500);
    }
  };

  const handleForgotEmailSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (forgotEmailStep === 1) {
      if (!recoveryContact) {
        setErrorMsg('Please enter a recovery email address or phone number.');
        return;
      }
      setForgotEmailStep(2);
    } else if (forgotEmailStep === 2) {
      if (!recoveryFirstName) {
        setErrorMsg('First name is required.');
        return;
      }

      // Search registered users
      const users = JSON.parse(localStorage.getItem('nm_registered_users') || '[]');
      const matches = users.filter(u => {
        const uName = (u.name || '').toLowerCase();
        const searchFirst = recoveryFirstName.toLowerCase();
        const searchLast = recoveryLastName.toLowerCase();
        
        return uName.includes(searchFirst) && (searchLast === '' || uName.includes(searchLast));
      });

      if (matches.length > 0) {
        setFoundEmails(matches.map(m => m.email));
        setForgotEmailStep(3);
      } else {
        setErrorMsg('No matching accounts found. Check the name spelling or try again.');
      }
    }
  };

  const handleOnboardingSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !regNo || !collegeEmail || !neoPatId || !alarmPassword) {
      setErrorMsg('Please fill in all academic profile parameters.');
      return;
    }

    // Retrieve current session/user
    const currentUser = JSON.parse(localStorage.getItem('nm_current_user') || '{}');
    const updatedProfile = {
      ...currentUser,
      name,
      regNo,
      collegeEmail,
      neoPatId,
      alarmPassword,
      alarmTone
    };

    // Update in registered users list
    const users = JSON.parse(localStorage.getItem('nm_registered_users') || '[]');
    const userIndex = users.findIndex(u => u.email.toLowerCase() === (currentUser.email || '').toLowerCase());
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedProfile };
      localStorage.setItem('nm_registered_users', JSON.stringify(users));
    } else {
      // If user registered through demo or social, add them
      users.push(updatedProfile);
      localStorage.setItem('nm_registered_users', JSON.stringify(users));
    }

    // Save session
    localStorage.setItem('nm_current_user', JSON.stringify(updatedProfile));
    
    // Save alarms preferences or tone locally
    localStorage.setItem('nm_alarm_tone', alarmTone);

    setSuccessMsg('Academic profile configured! Preparing mailbox dashboard...');
    setTimeout(() => {
      onOnboardingComplete(updatedProfile);
    }, 1200);
  };

  const handleBack = () => {
    if (activeMode === 'forgot') {
      if (resetStep === 2) {
        setResetStep(1);
        setErrorMsg('');
      } else {
        navigateTo('login');
      }
    } else if (activeMode === 'forgot-email') {
      if (forgotEmailStep === 2) {
        setForgotEmailStep(1);
        setErrorMsg('');
      } else if (forgotEmailStep === 3) {
        setForgotEmailStep(2);
        setErrorMsg('');
      } else {
        navigateTo('login');
      }
    } else {
      navigateTo('login');
    }
  };

  // Titles & Subtitles for Chrome card layouts
  const getPageInfo = () => {
    if (activeMode === 'forgot') {
      return {
        title: 'Account recovery',
        subtitle: 'Reset your NexMail password to secure your account'
      };
    } else if (activeMode === 'forgot-email') {
      switch (forgotEmailStep) {
        case 1:
          return {
            title: 'Find your email',
            subtitle: 'Enter your recovery email or phone number'
          };
        case 2:
          return {
            title: "What's your name?",
            subtitle: 'Enter the name on your NexMail account'
          };
        case 3:
          return {
            title: 'Found accounts',
            subtitle: 'Here is the email associated with your account details'
          };
        default:
          return { title: 'Find your email', subtitle: '' };
      }
    } else {
      // new-user
      return {
        title: 'Academic details',
        subtitle: 'Configure your college credentials to load alarms and schedules'
      };
    }
  };

  const pageInfo = getPageInfo();

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

      <div className="chrome-split-card" style={{ maxWidth: activeMode === 'new-user' ? '880px' : '820px' }}>
        {/* Left Side */}
        <div className="chrome-card-left">
          <div className="chrome-google-logo">
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <span className="chrome-google-logo-text">NexMail</span>
          </div>
          
          <h2 className="chrome-card-title">{pageInfo.title}</h2>
          <p className="chrome-card-subtitle">{pageInfo.subtitle}</p>
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

          {/* FORGOT PASSWORD FORM */}
          {activeMode === 'forgot' && (
            <form className="chrome-form-container" onSubmit={handleForgotPasswordSubmit}>
              {resetStep === 1 ? (
                <div className="chrome-input-group">
                  <input 
                    type="email" 
                    id="resetEmail"
                    className="chrome-input" 
                    placeholder=" "
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                  <label htmlFor="resetEmail" className="chrome-label">Registered email</label>
                  <p style={{ fontSize: '0.8rem', color: '#9aa0a6', marginTop: '8px' }}>
                    We will simulate sending a password verification code (123456) to this email address.
                  </p>
                </div>
              ) : (
                <>
                  <div className="chrome-input-group">
                    <input 
                      type="text" 
                      id="resetCode"
                      className="chrome-input" 
                      placeholder=" "
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                    />
                    <label htmlFor="resetCode" className="chrome-label">Verification code</label>
                  </div>
                  
                  <div className="chrome-input-group">
                    <input 
                      type="password" 
                      id="newPass"
                      className="chrome-input" 
                      placeholder=" "
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <label htmlFor="newPass" className="chrome-label">New password</label>
                  </div>

                  <div className="chrome-input-group">
                    <input 
                      type="password" 
                      id="confirmNewPass"
                      className="chrome-input" 
                      placeholder=" "
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <label htmlFor="confirmNewPass" className="chrome-label">Confirm password</label>
                  </div>
                </>
              )}

              <div className="chrome-card-footer">
                <div>
                  <button type="button" className="chrome-btn-text-only" onClick={() => navigateTo('login')}>
                    Sign in instead
                  </button>
                </div>
                <div>
                  <button type="submit" className="chrome-btn-blue-rect">
                    {resetStep === 1 ? 'Send code' : 'Save password'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* FORGOT EMAIL FLOW */}
          {activeMode === 'forgot-email' && (
            <form className="chrome-form-container" onSubmit={handleForgotEmailSubmit}>
              {forgotEmailStep === 1 && (
                <div className="chrome-input-group">
                  <input 
                    type="text" 
                    id="recoveryContact"
                    className="chrome-input" 
                    placeholder=" "
                    value={recoveryContact}
                    onChange={(e) => setRecoveryContact(e.target.value)}
                    required
                  />
                  <label htmlFor="recoveryContact" className="chrome-label">Phone number or recovery email</label>
                </div>
              )}

              {forgotEmailStep === 2 && (
                <>
                  <div className="chrome-input-group">
                    <input 
                      type="text" 
                      id="recFirst"
                      className="chrome-input" 
                      placeholder=" "
                      value={recoveryFirstName}
                      onChange={(e) => setRecoveryFirstName(e.target.value)}
                      required
                    />
                    <label htmlFor="recFirst" className="chrome-label">First name</label>
                  </div>

                  <div className="chrome-input-group">
                    <input 
                      type="text" 
                      id="recLast"
                      className="chrome-input" 
                      placeholder=" "
                      value={recoveryLastName}
                      onChange={(e) => setRecoveryLastName(e.target.value)}
                    />
                    <label htmlFor="recLast" className="chrome-label">Last name (optional)</label>
                  </div>
                </>
              )}

              {forgotEmailStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ color: '#9aa0a6', fontSize: '0.95rem' }}>We found matching accounts on this device:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {foundEmails.map((fEmail, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: '12px 16px', 
                          borderRadius: '8px', 
                          background: 'rgba(138, 180, 248, 0.08)', 
                          border: '1px solid rgba(138, 180, 248, 0.2)', 
                          fontWeight: 'bold', 
                          fontSize: '1rem',
                          color: '#8ab4f8'
                        }}
                      >
                        {fEmail}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="chrome-card-footer">
                <div>
                  <button type="button" className="chrome-btn-text-only" onClick={() => navigateTo('login')}>
                    Back to login
                  </button>
                </div>
                <div>
                  {forgotEmailStep < 3 ? (
                    <button type="submit" className="chrome-btn-blue-rect">Next</button>
                  ) : (
                    <button type="button" className="chrome-btn-blue-rect" onClick={() => navigateTo('login')}>
                      Sign in
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* NEW USER ACADEMIC ONBOARDING */}
          {activeMode === 'new-user' && (
            <form className="chrome-form-container" onSubmit={handleOnboardingSubmit}>
              <div className="chrome-form-row">
                <div className="chrome-input-group">
                  <input 
                    type="text" 
                    id="studName"
                    className="chrome-input" 
                    placeholder=" "
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <label htmlFor="studName" className="chrome-label">Full Name</label>
                </div>

                <div className="chrome-input-group">
                  <input 
                    type="text" 
                    id="regNum"
                    className="chrome-input" 
                    placeholder=" "
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    required
                  />
                  <label htmlFor="regNum" className="chrome-label">Registration No.</label>
                </div>
              </div>

              <div className="chrome-form-row">
                <div className="chrome-input-group">
                  <input 
                    type="email" 
                    id="collegeEmailInput"
                    className="chrome-input" 
                    placeholder=" "
                    value={collegeEmail}
                    onChange={(e) => setCollegeEmail(e.target.value)}
                    required
                  />
                  <label htmlFor="collegeEmailInput" className="chrome-label">College / Work Email</label>
                </div>

                <div className="chrome-input-group">
                  <input 
                    type="text" 
                    id="studentId"
                    className="chrome-input" 
                    placeholder=" "
                    value={neoPatId}
                    onChange={(e) => setNeoPatId(e.target.value)}
                    required
                  />
                  <label htmlFor="studentId" className="chrome-label">Employee / Student ID Number</label>
                </div>
              </div>

              <div style={{ margin: '10px 0', height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <h3 style={{ fontSize: '0.85rem', color: '#8ab4f8', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Priority Alarm Settings
              </h3>

              <div className="chrome-form-row">
                <div className="chrome-input-group" style={{ flex: 1.2 }}>
                  <input 
                    type="text" 
                    id="alarmPass"
                    className="chrome-input" 
                    placeholder=" "
                    value={alarmPassword}
                    onChange={(e) => setAlarmPassword(e.target.value)}
                    required
                  />
                  <label htmlFor="alarmPass" className="chrome-label">Emergency Alarm Password</label>
                  <span style={{ fontSize: '0.75rem', color: '#9aa0a6', marginTop: '4px', display: 'block' }}>
                    Phrase to silence loud audio alerts for urgent deadlines.
                  </span>
                </div>

                <div className="chrome-input-group">
                  <select 
                    className="chrome-select"
                    value={alarmTone}
                    onChange={(e) => setAlarmTone(e.target.value)}
                  >
                    <option value="emergency">Emergency Siren</option>
                    <option value="alarm">Digital Clock Alarm</option>
                    <option value="bell">Vintage School Bell</option>
                    <option value="chime">Subtle Sound Chime</option>
                  </select>
                  <label className="chrome-label" style={{ top: 0, fontSize: '0.75rem', color: '#8ab4f8' }}>Alarm Tone</label>
                  <span style={{ fontSize: '0.75rem', color: '#9aa0a6', marginTop: '4px', display: 'block' }}>
                    Played when high-priority emails arrive.
                  </span>
                </div>
              </div>

              <div className="chrome-card-footer">
                <div>
                  <button type="button" className="chrome-btn-text-only" onClick={() => navigateTo('login')}>
                    Cancel
                  </button>
                </div>
                <div>
                  <button type="submit" className="chrome-btn-blue-rect">Complete Academic Setup</button>
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

export default ForgotOrNewUserPage;
