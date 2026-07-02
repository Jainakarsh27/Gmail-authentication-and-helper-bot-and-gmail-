import React, { useState } from 'react';

const AuthPage = ({ onLoginSuccess, navigateTo }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Register form fields
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status message
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    // Retrieve registered users from localStorage
    const users = JSON.parse(localStorage.getItem('nm_registered_users') || '[]');
    const matchedUser = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());

    if (matchedUser) {
      if (matchedUser.password === loginPassword) {
        setSuccessMsg('Login successful! Loading dashboard...');
        
        // Save current active session
        localStorage.setItem('nm_current_user', JSON.stringify(matchedUser));
        
        setTimeout(() => {
          onLoginSuccess(matchedUser);
        }, 800);
      } else {
        setErrorMsg('Invalid password. Please try again.');
      }
    } else {
      // Allow demo login with any email if no users registered yet
      setSuccessMsg('Creating a temporary session for Demo...');
      const demoUser = {
        email: loginEmail,
        name: loginEmail.split('@')[0],
        regNo: 'TEMP-DEMO',
        collegeEmail: loginEmail,
        neoPatId: 'DEMO-NP',
        alarmPassword: 'STOP'
      };
      
      localStorage.setItem('nm_current_user', JSON.stringify(demoUser));
      setTimeout(() => {
        onLoginSuccess(demoUser);
      }, 800);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!registerEmail || !registerPassword || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('nm_registered_users') || '[]');
    const exists = users.some(u => u.email.toLowerCase() === registerEmail.toLowerCase());

    if (exists) {
      setErrorMsg('This email is already registered.');
      return;
    }

    // Save temporary registration in localStorage
    const newUser = {
      email: registerEmail,
      password: registerPassword,
      // Default placeholder details to be configured on New User onboarding screen
      name: '',
      regNo: '',
      collegeEmail: registerEmail,
      neoPatId: '',
      alarmPassword: 'STOP'
    };

    users.push(newUser);
    localStorage.setItem('nm_registered_users', JSON.stringify(users));
    
    // Store as temporary session for onboarding
    localStorage.setItem('nm_current_user', JSON.stringify(newUser));

    setSuccessMsg('Account created successfully! Redirecting to setup details...');
    setTimeout(() => {
      // Navigate to onboarding details (New User page)
      navigateTo('new-user');
    }, 1000);
  };

  const handleGoogleSignIn = () => {
    // Redirection to Spring Boot OAuth2 endpoint
    window.location.href = '/oauth2/authorization/google';
  };

  const handleDemoSignIn = () => {
    // Immediate login success for quick demo
    const demoUser = {
      email: 'demo.student@university.edu',
      name: 'Demo Student',
      regNo: 'REG123456',
      collegeEmail: 'demo.student@university.edu',
      neoPatId: 'NP998877',
      alarmPassword: 'STOP'
    };
    localStorage.setItem('nm_current_user', JSON.stringify(demoUser));
    onLoginSuccess(demoUser);
  };

  return (
    <div className="nm-auth-container">
      <div className="nm-auth-bg-blob-1"></div>
      <div className="nm-auth-bg-blob-2"></div>
      
      <div className="nm-auth-card">
        <div className="nm-auth-header">
          <div className="nm-auth-logo-container">
            <div className="nm-auth-logo-icon">N</div>
            <div className="nm-auth-logo-text">NexMail</div>
          </div>
          <h2 className="nm-auth-title">Welcome to NexMail</h2>
          <p className="nm-auth-subtitle">Intelligent Academic Email Assistant</p>
        </div>

        <div className="nm-auth-tabs">
          <button 
            className={`nm-auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Login
          </button>
          <button 
            className={`nm-auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Register
          </button>
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

        {activeTab === 'login' ? (
          <form className="nm-auth-form" onSubmit={handleLogin}>
            <div className="nm-input-group">
              <label className="nm-input-label">Email Address</label>
              <input 
                type="email" 
                className="nm-input-field" 
                placeholder="you@college.edu"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            
            <div className="nm-input-group">
              <label className="nm-input-label">Password</label>
              <input 
                type="password" 
                className="nm-input-field" 
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <div className="nm-auth-actions">
              <label className="nm-auth-checkbox-label">
                <input 
                  type="checkbox" 
                  className="nm-auth-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <span className="nm-auth-link" onClick={() => navigateTo('forgot-password')}>
                Forgot Password?
              </span>
            </div>

            <button type="submit" className="nm-btn-primary">
              Log In
            </button>
          </form>
        ) : (
          <form className="nm-auth-form" onSubmit={handleRegister}>
            <div className="nm-input-group">
              <label className="nm-input-label">Email Address</label>
              <input 
                type="email" 
                className="nm-input-field" 
                placeholder="new.student@college.edu"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
            </div>
            
            <div className="nm-input-group">
              <label className="nm-input-label">Password</label>
              <input 
                type="password" 
                className="nm-input-field" 
                placeholder="•••••••• (Min 6 chars)"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />
            </div>

            <div className="nm-input-group">
              <label className="nm-input-label">Confirm Password</label>
              <input 
                type="password" 
                className="nm-input-field" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="nm-btn-primary">
              Register Account
            </button>
          </form>
        )}

        <div className="nm-auth-divider">or continue with</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="nm-btn-social" onClick={handleGoogleSignIn}>
            <svg className="nm-btn-social-icon" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15.02 1 12 1 7.28 1 3.25 3.72 1.34 7.69l3.87 3C6.13 7.8 8.85 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.48c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.48-4.97 3.48-8.63z"/>
              <path fill="#FBBC05" d="M5.21 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31L1.34 6.69C.49 8.39 0 10.14 0 12s.49 3.61 1.34 5.31l3.87-3z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.03.69-2.35 1.1-4.23 1.1-3.15 0-5.87-2.76-6.79-5.65l-3.87 3C3.25 20.28 7.28 23 12 23z"/>
            </svg>
            Google Workspace
          </button>
          
          <button className="nm-btn-social" onClick={handleDemoSignIn} style={{ borderStyle: 'dashed', borderColor: '#3b82f6', color: '#3b82f6' }}>
            ⚡ Fast Demo Sign-In
          </button>
        </div>

        <div className="nm-auth-footer">
          <p>Already a registered user with profile parameters?</p>
          <span className="nm-auth-link" onClick={() => navigateTo('new-user')}>
            Skip to Profile Setup →
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
