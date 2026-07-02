import React, { useState, useEffect } from 'react';

const ForgotOrNewUserPage = ({ mode = 'forgot', onOnboardingComplete, navigateTo }) => {
  const [activeMode, setActiveMode] = useState(mode); // 'forgot' | 'new-user'
  
  // Forgot Password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: Reset Form
  
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

  return (
    <div className="nm-auth-container">
      <div className="nm-auth-bg-blob-1"></div>
      <div className="nm-auth-bg-blob-2"></div>
      
      <div className="nm-auth-card" style={{ maxWidth: activeMode === 'new-user' ? '600px' : '480px' }}>
        <div className="nm-auth-header">
          <div className="nm-auth-logo-container">
            <div className="nm-auth-logo-icon">N</div>
            <div className="nm-auth-logo-text">NexMail</div>
          </div>
          <h2 className="nm-auth-title">
            {activeMode === 'forgot' ? 'Reset Password' : 'New User Academic Onboarding'}
          </h2>
          <p className="nm-auth-subtitle">
            {activeMode === 'forgot' 
              ? 'Recover access to your academic mailbox assistant' 
              : 'Configure your credentials to enable smart alarms and course tracking'}
          </p>
        </div>

        {errorMsg && (
          <div className="nm-status-badge error" style={{ width: '100%' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="nm-status-badge success" style={{ width: '100%' }}>
            ✓ {successMsg}
          </div>
        )}

        {activeMode === 'forgot' ? (
          <form className="nm-auth-form" onSubmit={handleForgotPasswordSubmit}>
            {resetStep === 1 ? (
              <div className="nm-input-group">
                <label className="nm-input-label">Registered Email Address</label>
                <input 
                  type="email" 
                  className="nm-input-field" 
                  placeholder="student@college.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  We will simulate sending a verification reset code to this email.
                </p>
              </div>
            ) : (
              <>
                <div className="nm-input-group">
                  <label className="nm-input-label">Verification Code (Sent to email)</label>
                  <input 
                    type="text" 
                    className="nm-input-field" 
                    placeholder="Enter 123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                  />
                </div>
                
                <div className="nm-input-group">
                  <label className="nm-input-label">New Password</label>
                  <input 
                    type="password" 
                    className="nm-input-field" 
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="nm-input-group">
                  <label className="nm-input-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="nm-input-field" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <button type="submit" className="nm-btn-primary">
              {resetStep === 1 ? 'Send Verification Code' : 'Update Password'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <span className="nm-auth-link" onClick={() => navigateTo('login')}>
                Back to Login
              </span>
            </div>
          </form>
        ) : (
          <form className="nm-auth-form" onSubmit={handleOnboardingSubmit}>
            <div className="nm-onboarding-grid">
              <div className="nm-input-group">
                <label className="nm-input-label">Full Name</label>
                <input 
                  type="text" 
                  className="nm-input-field" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="nm-input-group">
                <label className="nm-input-label">Registration Number</label>
                <input 
                  type="text" 
                  className="nm-input-field" 
                  placeholder="2026CSE0045"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="nm-onboarding-grid">
              <div className="nm-input-group">
                <label className="nm-input-label">College Email Address</label>
                <input 
                  type="email" 
                  className="nm-input-field" 
                  placeholder="john.doe@university.edu"
                  value={collegeEmail}
                  onChange={(e) => setCollegeEmail(e.target.value)}
                  required
                />
              </div>

              <div className="nm-input-group">
                <label className="nm-input-label">NeoPat Portal Student ID</label>
                <input 
                  type="text" 
                  className="nm-input-field" 
                  placeholder="NP_STUDENT_9898"
                  value={neoPatId}
                  onChange={(e) => setNeoPatId(e.target.value)}
                  required
                />
              </div>
            </div>

            <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
            
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Priority Alarm Settings
            </h3>
            
            <div className="nm-onboarding-grid">
              <div className="nm-input-group">
                <label className="nm-input-label">Emergency Alarm Password</label>
                <input 
                  type="text" 
                  className="nm-input-field" 
                  placeholder="e.g. STOP or SILENCE"
                  value={alarmPassword}
                  onChange={(e) => setAlarmPassword(e.target.value)}
                  required
                />
                <span style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.2' }}>
                  Used to silence sounding audio alerts for urgent registration deadlines.
                </span>
              </div>

              <div className="nm-input-group">
                <label className="nm-input-label">Preferred Alarm Tone</label>
                <select 
                  className="nm-select-field"
                  value={alarmTone}
                  onChange={(e) => setAlarmTone(e.target.value)}
                >
                  <option value="emergency">Emergency Siren</option>
                  <option value="alarm">Digital Clock Alarm</option>
                  <option value="bell">Vintage School Bell</option>
                  <option value="chime">Subtle Sound Chime</option>
                </select>
                <span style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.2' }}>
                  The sound played when a high-priority academic email is synchronized.
                </span>
              </div>
            </div>

            <button type="submit" className="nm-btn-primary" style={{ marginTop: '8px' }}>
              Complete Academic Profile Setup
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <span className="nm-auth-link" onClick={() => navigateTo('login')}>
                Back to Login Page
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotOrNewUserPage;
