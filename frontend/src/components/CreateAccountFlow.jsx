import React, { useState } from 'react';

const CreateAccountFlow = ({ navigateTo, onLoginSuccess }) => {
  const [step, setStep] = useState(1); // 1: Name, 2: Basic Info, 3: Choose Email, 4: Password
  
  // Fields state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  
  const [selectedEmailType, setSelectedEmailType] = useState('suggested1'); // 'suggested1' | 'suggested2' | 'custom'
  const [customEmailPrefix, setCustomEmailPrefix] = useState('');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Error / Status Messages
  const [errorMsg, setErrorMsg] = useState('');

  // Generated suggestions based on first/last name
  const getSuggestions = () => {
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
    return {
      suggested1: `${cleanFirst}.${cleanLast}@gmail.com`,
      suggested2: `${cleanLast}${cleanFirst}789@gmail.com`
    };
  };

  const handleNext = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (step === 1) {
      if (!firstName.trim()) {
        setErrorMsg('Please enter your first name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!birthMonth || !birthDay || !birthYear || !gender) {
        setErrorMsg('Please complete all basic information fields.');
        return;
      }
      const dayNum = parseInt(birthDay);
      const yearNum = parseInt(birthYear);
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        setErrorMsg('Please enter a valid day of the month.');
        return;
      }
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        setErrorMsg('Please enter a valid year.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (selectedEmailType === 'custom' && !customEmailPrefix.trim()) {
        setErrorMsg('Please enter a custom email address prefix.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!password || !confirmPassword) {
        setErrorMsg('Please enter both password fields.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }

      // Finish registration
      const finalSuggestions = getSuggestions();
      let chosenEmail = '';
      if (selectedEmailType === 'suggested1') {
        chosenEmail = finalSuggestions.suggested1;
      } else if (selectedEmailType === 'suggested2') {
        chosenEmail = finalSuggestions.suggested2;
      } else {
        chosenEmail = `${customEmailPrefix.toLowerCase().trim()}@gmail.com`;
      }

      const users = JSON.parse(localStorage.getItem('nm_registered_users') || '[]');
      const emailExists = users.some(u => u.email.toLowerCase() === chosenEmail.toLowerCase());
      
      if (emailExists) {
        setErrorMsg('This email address is already in use.');
        setStep(3); // go back to change email
        return;
      }

      // Create new user record
      const newUser = {
        email: chosenEmail,
        password: password,
        name: `${firstName} ${lastName}`.trim(),
        regNo: '',
        collegeEmail: chosenEmail,
        neoPatId: '',
        alarmPassword: 'STOP',
        alarmTone: 'emergency',
        gender: gender,
        dob: `${birthYear}-${birthMonth}-${birthDay}`
      };

      users.push(newUser);
      localStorage.setItem('nm_registered_users', JSON.stringify(users));
      
      // Store current user session
      localStorage.setItem('nm_current_user', JSON.stringify(newUser));

      // Redirect to NexMail specific onboarding parameters (ForgotOrNewUserPage.jsx onboarding)
      navigateTo('new-user');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrorMsg('');
    } else {
      navigateTo('login');
    }
  };

  // Left card titles/subtitles by step
  const getStepText = () => {
    switch (step) {
      case 1:
        return {
          title: 'Create a NexMail Account',
          subtitle: 'Enter your name to start setting up your academic inbox'
        };
      case 2:
        return {
          title: 'Basic information',
          subtitle: 'Enter your birthday and gender'
        };
      case 3:
        return {
          title: 'Choose your email address',
          subtitle: 'Pick a NexMail address or create your own'
        };
      case 4:
        return {
          title: 'Create a strong password',
          subtitle: 'Create a secure password to protect your academic records'
        };
      default:
        return {
          title: 'Create a NexMail Account',
          subtitle: ''
        };
    }
  };

  const suggestions = firstName ? getSuggestions() : { suggested1: '', suggested2: '' };
  const stepInfo = getStepText();

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
        {/* Left column */}
        <div className="chrome-card-left">
          <div className="chrome-google-logo">
            {/* NexMail Custom Logo Icon resembling Google style */}
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <span className="chrome-google-logo-text">NexMail</span>
          </div>
          
          <h2 className="chrome-card-title">{stepInfo.title}</h2>
          <p className="chrome-card-subtitle">{stepInfo.subtitle}</p>
        </div>

        {/* Right column */}
        <div className="chrome-card-right">
          <form className="chrome-form-container" onSubmit={handleNext}>
            {errorMsg && (
              <div className="nm-status-badge error" style={{ width: '100%', marginBottom: '10px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* STEP 1: NAME */}
            {step === 1 && (
              <>
                <div className="chrome-input-group">
                  <input
                    type="text"
                    id="firstName"
                    className={`chrome-input ${errorMsg && !firstName ? 'chrome-input-error' : ''}`}
                    placeholder=" "
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <label htmlFor="firstName" className="chrome-label">First name</label>
                </div>

                <div className="chrome-input-group">
                  <input
                    type="text"
                    id="lastName"
                    className="chrome-input"
                    placeholder=" "
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <label htmlFor="lastName" className="chrome-label">Last name (optional)</label>
                </div>
              </>
            )}

            {/* STEP 2: DOB & GENDER */}
            {step === 2 && (
              <>
                <div className="chrome-form-row">
                  <div className="chrome-input-group" style={{ flex: 1.5 }}>
                    <select
                      className="chrome-select"
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      required
                    >
                      <option value="" disabled hidden>Month</option>
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>

                  <div className="chrome-input-group" style={{ flex: 0.8 }}>
                    <input
                      type="text"
                      id="birthDay"
                      className="chrome-input"
                      placeholder=" "
                      maxLength="2"
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                    />
                    <label htmlFor="birthDay" className="chrome-label">Day</label>
                  </div>

                  <div className="chrome-input-group" style={{ flex: 1 }}>
                    <input
                      type="text"
                      id="birthYear"
                      className="chrome-input"
                      placeholder=" "
                      maxLength="4"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                    />
                    <label htmlFor="birthYear" className="chrome-label">Year</label>
                  </div>
                </div>

                <div className="chrome-input-group" style={{ marginTop: '10px' }}>
                  <select
                    className="chrome-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="" disabled hidden>Gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="custom">Rather not say</option>
                  </select>
                </div>
              </>
            )}

            {/* STEP 3: EMAIL SELECTION */}
            {step === 3 && (
              <>
                <div className="chrome-option-list">
                  <div 
                    className={`chrome-option-item ${selectedEmailType === 'suggested1' ? 'selected' : ''}`}
                    onClick={() => setSelectedEmailType('suggested1')}
                  >
                    <div className="chrome-option-radio"></div>
                    <span className="chrome-option-text">{suggestions.suggested1}</span>
                  </div>

                  <div 
                    className={`chrome-option-item ${selectedEmailType === 'suggested2' ? 'selected' : ''}`}
                    onClick={() => setSelectedEmailType('suggested2')}
                  >
                    <div className="chrome-option-radio"></div>
                    <span className="chrome-option-text">{suggestions.suggested2}</span>
                  </div>

                  <div 
                    className={`chrome-option-item ${selectedEmailType === 'custom' ? 'selected' : ''}`}
                    onClick={() => setSelectedEmailType('custom')}
                  >
                    <div className="chrome-option-radio"></div>
                    <span className="chrome-option-text">Create your own Gmail address</span>
                  </div>
                </div>

                {selectedEmailType === 'custom' && (
                  <div className="chrome-input-group" style={{ marginTop: '12px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        id="customEmailPrefix"
                        className="chrome-input"
                        placeholder=" "
                        value={customEmailPrefix}
                        onChange={(e) => setCustomEmailPrefix(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ''))}
                        required
                      />
                      <label htmlFor="customEmailPrefix" className="chrome-label">Create a Gmail address</label>
                    </div>
                    <span style={{ marginLeft: '12px', color: '#9aa0a6', fontSize: '1rem', fontWeight: '500' }}>@gmail.com</span>
                  </div>
                )}
              </>
            )}

            {/* STEP 4: PASSWORD */}
            {step === 4 && (
              <>
                <div className="chrome-input-group">
                  <input
                    type="password"
                    id="password"
                    className="chrome-input"
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label htmlFor="password" className="chrome-label">Password</label>
                </div>

                <div className="chrome-input-group">
                  <input
                    type="password"
                    id="confirmPassword"
                    className="chrome-input"
                    placeholder=" "
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <label htmlFor="confirmPassword" className="chrome-label">Confirm password</label>
                </div>
                
                <p style={{ fontSize: '0.8rem', color: '#9aa0a6', marginTop: '4px', lineHeight: '1.4' }}>
                  Create a password with at least 6 characters. You will use this to access your college assistant.
                </p>
              </>
            )}
          </form>

          {/* Footer inside Card */}
          <div className="chrome-card-footer">
            <div className="chrome-footer-left"></div>
            <div>
              <button 
                type="submit" 
                className="chrome-btn-blue-rect" 
                onClick={handleNext}
              >
                {step === 4 ? 'Submit' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer standard page row */}
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

export default CreateAccountFlow;
