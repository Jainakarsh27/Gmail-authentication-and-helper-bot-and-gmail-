import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import ForgotOrNewUserPage from './components/ForgotOrNewUserPage';
import ProfileSetupPage from './components/ProfileSetupPage';
import CreateAccountFlow from './components/CreateAccountFlow';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [route, setRoute] = useState(window.location.hash || '#/setup-profile');

  // Check authentication status
  const checkAuth = () => {
    fetch('/api/user')
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not authenticated');
      })
      .then(userData => {
        setIsAuthenticated(true);
        // Sync database user to localStorage session
        const dbUser = userData.dbUser || {};
        const profileUser = {
          email: userData.email || dbUser.email || '',
          name: dbUser.name || userData.name || '',
          regNo: dbUser.regNo || '',
          collegeEmail: dbUser.collegeEmail || userData.email || '',
          neoPatId: dbUser.neoPatId || '',
          alarmPassword: dbUser.alarmPassword || 'STOP'
        };
        localStorage.setItem('nm_current_user', JSON.stringify(profileUser));
        
        // If current route is auth-related, redirect to mail
        if (['#/setup-profile', '#/login', '#/create-name', '#/forgot-email', '#/forgot-password', '#/new-user'].includes(window.location.hash)) {
          window.location.hash = '#/mail';
        }
      })
      .catch(() => {
        // If no backend session, check if there is a simulated frontend session
        const localUser = localStorage.getItem('nm_current_user');
        if (localUser) {
          setIsAuthenticated(true);
          if (['#/setup-profile', '#/login', '#/create-name', '#/forgot-email', '#/forgot-password', '#/new-user', ''].includes(window.location.hash)) {
            window.location.hash = '#/mail';
          }
        } else {
          setIsAuthenticated(false);
          if (window.location.hash === '#/mail') {
            window.location.hash = '#/setup-profile';
          }
        }
      });
  };

  useEffect(() => {
    // Set document title to NexMail
    document.title = "NexMail - Intelligent Academic Assistant";
    checkAuth();

    // Listen to hash change for routing
    const handleHashChange = () => {
      const currentHash = window.location.hash || '#/setup-profile';
      setRoute(currentHash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync route on auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      if (['#/setup-profile', '#/login', '#/create-name', '#/forgot-email', '#/forgot-password', '#/new-user', ''].includes(window.location.hash)) {
        window.location.hash = '#/mail';
      }
    } else {
      if (window.location.hash === '#/mail') {
        window.location.hash = '#/setup-profile';
      }
    }
  }, [isAuthenticated]);

  const navigateTo = (pageName) => {
    window.location.hash = `#/${pageName}`;
  };

  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    navigateTo('mail');
  };

  const handleLogout = () => {
    localStorage.removeItem('nm_current_user');
    setIsAuthenticated(false);
    
    // Attempt backend logout redirect or direct fallback
    fetch('/logout', { method: 'POST' })
      .finally(() => {
        navigateTo('setup-profile');
      });
  };

  // Routing render logic
  const renderContent = () => {
    switch (route) {
      case '#/setup-profile':
        return <ProfileSetupPage navigateTo={navigateTo} onLoginSuccess={handleLoginSuccess} />;
      case '#/login':
        return <AuthPage onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} />;
      case '#/forgot-email':
        return <ForgotOrNewUserPage mode="forgot-email" navigateTo={navigateTo} />;
      case '#/forgot-password':
        return <ForgotOrNewUserPage mode="forgot" navigateTo={navigateTo} />;
      case '#/create-name':
        return <CreateAccountFlow navigateTo={navigateTo} onLoginSuccess={handleLoginSuccess} />;
      case '#/new-user':
        return (
          <ForgotOrNewUserPage 
            mode="new-user" 
            onOnboardingComplete={handleLoginSuccess} 
            navigateTo={navigateTo} 
          />
        );
      case '#/mail':
        if (!isAuthenticated) {
          // If trying to access mail but not authenticated, fallback to setup profile
          return <ProfileSetupPage navigateTo={navigateTo} onLoginSuccess={handleLoginSuccess} />;
        }
        return <Dashboard onLogout={handleLogout} />;
      default:
        // Fallback for unknown route
        return <ProfileSetupPage navigateTo={navigateTo} onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {renderContent()}
    </div>
  );
}

export default App;
