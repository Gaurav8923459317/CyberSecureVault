// src/components/Sidebar.jsx - UPDATED
import React from 'react';
import '../styles/Sidebar.css';

function Sidebar({ onNavigate, currentView }) {
  
  const handleNavigation = (view) => {
    if (onNavigate) {
      onNavigate(view); // ✅ USE THE PASSED NAVIGATION HANDLER
    } else {
      // Fallback for demo (should not happen now)
      switch(view) {
        case 'dashboard':
          alert('📊 Dashboard: Your secure vault overview');
          break;
        case 'settings':
          alert('⚙️ Settings: Vault and security preferences');
          break;
        default:
          alert(`Navigating to: ${view}`);
      }
    }
  };

  return (
    <div className="sidebar">
      
      <div className="sidebar__header">
        <h3>🔐 Vault Access</h3>
      </div>

      <nav className="sidebar__nav">
        
        {/* Dashboard Button */}
        <div 
          className={`nav__item ${currentView === 'dashboard' ? 'nav__item--active' : ''}`} 
          onClick={() => handleNavigation('dashboard')}
        >
          <span className="nav__icon">📊</span>
          <span className="nav__text">Dashboard</span>
        </div>

        {/* Quick Encrypt Button */}
        <div 
          className={`nav__item ${currentView === 'quickEncrypt' ? 'nav__item--active' : ''}`} 
          onClick={() => handleNavigation('quickEncrypt')}
        >
          <span className="nav__icon">⚡</span>
          <span className="nav__text">Quick Encrypt</span>
        </div>

        {/* My Encrypted Vault Button */}
        <div 
          className={`nav__item ${currentView === 'vaultManager' ? 'nav__item--active' : ''}`} 
          onClick={() => handleNavigation('vaultManager')}
        >
          <span className="nav__icon">🔐</span>
          <span className="nav__text">My Encrypted Vault</span>
        </div>

        {/* Cloud Backup Button */}
        <div 
          className={`nav__item ${currentView === 'cloudBackup' ? 'nav__item--active' : ''}`} 
          onClick={() => handleNavigation('cloudBackup')}
        >
          <span className="nav__icon">☁️</span>
          <span className="nav__text">Cloud Backup</span>
        </div>

        {/* Settings Button - NOW PROPERLY CONNECTED */}
        <div 
          className={`nav__item ${currentView === 'settings' ? 'nav__item--active' : ''}`} 
          onClick={() => handleNavigation('settings')}
        >
          <span className="nav__icon">⚙️</span>
          <span className="nav__text">Settings</span>
        </div>

      </nav>

      <div className="sidebar__footer">
        <p>Military-Grade Encryption</p>
        <p style={{fontSize: '0.8rem', opacity: 0.7}}>AES-256 • Secure Vault</p>
      </div>

    </div>
  );
}

export default Sidebar;