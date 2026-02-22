// src/App.js - UPDATED WITH SETTINGS
import React, { useEffect, useState } from "react";
import "./App.css"; 
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Signup from "./components/Signup";
import VaultSetup from "./components/VaultSetup";
import Settings from "./components/Settings"; // ✅ NEW IMPORT
import { AuthProvider, useAuth } from "./context/AuthContext";
import QuickEncrypt from "./components/QuickEncrypt";        // ✅ ADD THIS
import VaultManager from "./components/VaultManager";        // ✅ ADD THIS  
import CloudBackupManager from "./components/CloudBackupManager";

// 🔸 Component that decides which screen to show
const AppContent = () => {
  const { currentUser } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [showVaultSetup, setShowVaultSetup] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard"); // ✅ NEW STATE

  useEffect(() => {
    if (currentUser) {
      // Check if vault is already set up
      const vaultPassword = localStorage.getItem(`vaultMasterPassword_${currentUser.id}`);
      if (!vaultPassword) {
        setShowVaultSetup(true);
      }
    }
  }, [currentUser]);

  // 🕓 Loading indicator
  if (currentUser === undefined) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-icon">🔒</div>
          <h2>Loading CyberSecure Vault...</h2>
        </div>
      </div>
    );
  }

  // ✅ USER NOT LOGGED IN
  if (!currentUser) {
    return (
      <div className="auth-container">
        <Login
          onSwitchToSignup={() => setShowSignup(true)}
        />
        {showSignup && (
          <Signup
            onClose={() => setShowSignup(false)}
            onSwitchToLogin={() => setShowSignup(false)}
          />
        )}
      </div>
    );
  }

  // ✅ VAULT SETUP REQUIRED
  if (showVaultSetup) {
    return (
      <VaultSetup 
        user={currentUser}
        onSetupComplete={() => setShowVaultSetup(false)}
      />
    );
  }

  // ✅ HANDLE NAVIGATION - NEW FUNCTION
  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  // ✅ HANDLE BACK TO DASHBOARD - NEW FUNCTION
  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  // ✅ RENDER CURRENT VIEW
 // ✅ RENDER CURRENT VIEW - UPDATE THIS FUNCTION
const renderCurrentView = () => {
  switch (currentView) {
    case "dashboard":
      return <Dashboard user={currentUser} onLogout={() => {}} />;
    
    case "quickEncrypt":                                   // ✅ ADD THIS CASE
      return <QuickEncrypt user={currentUser} onBack={handleBackToDashboard} />;
    
    case "vaultManager":                                   // ✅ ADD THIS CASE  
      return <VaultManager user={currentUser} onBack={handleBackToDashboard} />;
    
    case "cloudBackup":                                    // ✅ ADD THIS CASE
      return <CloudBackupManager user={currentUser} onBack={handleBackToDashboard} />;
    
    case "settings":
      return (
        <Settings 
          user={currentUser} 
          onBack={handleBackToDashboard}
        />
      );
    
    default:
      return <Dashboard user={currentUser} />;
  }
};

  // ✅ USER LOGGED IN & VAULT READY
  return (
    <div className="App">
      <div className="app__body">
        <Sidebar 
          user={currentUser} 
          onNavigate={handleNavigation} // ✅ PASS NAVIGATION HANDLER
          currentView={currentView}     // ✅ PASS CURRENT VIEW
        />
        <div className="app__content">
          <div className="main-content">
            {renderCurrentView()}       {/* ✅ RENDER DYNAMIC CONTENT */}
          </div>
        </div>
      </div>
    </div>
  );
};

// 🧠 Wrap everything inside AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;