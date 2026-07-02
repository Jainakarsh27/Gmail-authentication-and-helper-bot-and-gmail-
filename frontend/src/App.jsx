import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import ForgotOrNewUserPage from './components/ForgotOrNewUserPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [route, setRoute] = useState(window.location.hash || '#/login');

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
        if (['#/login', '#/register', '#/forgot-password', '#/new-user'].includes(window.location.hash)) {
          window.location.hash = '#/mail';
        }
      })
      .catch(() => {
        // If no backend session, check if there is a simulated frontend session
        const localUser = localStorage.getItem('nm_current_user');
        if (localUser) {
          setIsAuthenticated(true);
          if (['#/login', '#/register', '#/forgot-password', '#/new-user', ''].includes(window.location.hash)) {
            window.location.hash = '#/mail';
          }
        } else {
          setIsAuthenticated(false);
          if (window.location.hash === '#/mail') {
            window.location.hash = '#/login';
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
      const currentHash = window.location.hash || '#/login';
      setRoute(currentHash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync route on auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      if (['#/login', '#/register', '#/forgot-password', '#/new-user', ''].includes(window.location.hash)) {
        window.location.hash = '#/mail';
      }
    } else {
      if (window.location.hash === '#/mail') {
        window.location.hash = '#/login';
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
        navigateTo('login');
      });
  };

  // Routing render logic
  const renderContent = () => {
    switch (route) {
      case '#/login':
        return <AuthPage onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} />;
      case '#/register':
        return <AuthPage onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} />;
      case '#/forgot-password':
        return <ForgotOrNewUserPage mode="forgot" navigateTo={navigateTo} />;
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
          // If trying to access mail but not authenticated, fallback to login
          return <AuthPage onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} />;
        }
        return <Dashboard onLogout={handleLogout} />;
      default:
        // Fallback for unknown route
        return <AuthPage onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {renderContent()}
    </div>
  );
}

export default App;
