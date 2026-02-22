// src/components/Settings.jsx - PROFESSIONAL ENHANCED VERSION
import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Lock, Shield, Bell, Palette, Database, Download, Upload, 
  Eye, EyeOff, Clock, Smartphone, LogOut, CheckCircle, AlertTriangle,
  User, Key, Cloud, HardDrive
} from "lucide-react";
import "../styles/Settings.css";

const Settings = ({ user, onBack, onSettingsUpdate }) => {
  const [activeTab, setActiveTab] = useState("security");
  const [vaultPassword, setVaultPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(15);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Load user settings
  useEffect(() => {
    loadUserSettings();
    checkMFAStatus();
  }, [user]);

  const loadUserSettings = () => {
    const savedTheme = localStorage.getItem(`theme_${user.id}`) || "light";
    const savedNotifications = localStorage.getItem(`notifications_${user.id}`) !== "false";
    const savedAutoBackup = localStorage.getItem(`autoBackup_${user.id}`) === "true";
    const savedSessionTimeout = localStorage.getItem(`sessionTimeout_${user.id}`) || "15";
    
    setTheme(savedTheme);
    setNotifications(savedNotifications);
    setAutoBackup(savedAutoBackup);
    setSessionTimeout(parseInt(savedSessionTimeout));
  };

  const checkMFAStatus = () => {
    // Check if MFA is enabled (you can integrate with your auth system)
    const mfaStatus = localStorage.getItem(`mfaEnabled_${user.id}`) === "true";
    setMfaEnabled(mfaStatus);
  };

  // 🔐 PASSWORD STRENGTH CALCULATOR
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
    if (password.match(/\d/)) strength += 25;
    if (password.match(/[^a-zA-Z\d]/)) strength += 25;
    
    setPasswordStrength(strength);
  };

  // 🔐 CHANGE VAULT PASSWORD
  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert("❌ Passwords don't match!");
      return;
    }

    if (newPassword.length < 8) {
      alert("❌ Password must be at least 8 characters!");
      return;
    }

    if (passwordStrength < 75) {
      alert("❌ Password is too weak! Use uppercase, lowercase, numbers, and symbols.");
      return;
    }

    // Update vault password
    localStorage.setItem(`vaultMasterPassword_${user.id}`, btoa(newPassword));
    
    alert("✅ Vault password updated successfully!");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordStrength(0);
    
    if (onSettingsUpdate) onSettingsUpdate();
  };

  // 🎨 THEME MANAGEMENT
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem(`theme_${user.id}`, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Apply theme to entire app
    applyThemeToApp(newTheme);
  };

  const applyThemeToApp = (theme) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--text-primary', '#ffffff');
    } else if (theme === 'light') {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--text-primary', '#1a1a1a');
    }
    // Auto theme would follow system preferences
  };

  // 🔔 NOTIFICATIONS MANAGEMENT
  const handleNotificationsToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem(`notifications_${user.id}`, newValue.toString());
  };

  // ☁️ AUTO BACKUP MANAGEMENT
  const handleAutoBackupToggle = () => {
    const newValue = !autoBackup;
    setAutoBackup(newValue);
    localStorage.setItem(`autoBackup_${user.id}`, newValue.toString());
    
    if (newValue) {
      // Schedule automatic backups
      scheduleAutoBackup();
    }
  };

  const scheduleAutoBackup = () => {
    // This would integrate with your backup scheduler
    console.log("Auto backup scheduled");
  };

  // ⏰ SESSION MANAGEMENT
  const handleSessionTimeoutChange = (minutes) => {
    setSessionTimeout(minutes);
    localStorage.setItem(`sessionTimeout_${user.id}`, minutes.toString());
  };

  // 📱 MFA MANAGEMENT
  const handleMFAToggle = () => {
    const newValue = !mfaEnabled;
    setMfaEnabled(newValue);
    localStorage.setItem(`mfaEnabled_${user.id}`, newValue.toString());
    
    if (newValue) {
      // Redirect to MFA setup
      alert("Redirecting to MFA setup...");
      // You would integrate with your MFA component here
    } else {
      if (window.confirm("Are you sure you want to disable MFA? This reduces your account security.")) {
        alert("MFA disabled");
      } else {
        setMfaEnabled(true); // Revert if user cancels
      }
    }
  };

  // 💾 DATA MANAGEMENT
  const handleExportData = () => {
    const userData = {
      userInfo: {
        id: user.id,
        email: user.email,
        exportDate: new Date().toISOString()
      },
      vaultSettings: {
        theme: theme,
        notifications: notifications,
        autoBackup: autoBackup,
        sessionTimeout: sessionTimeout,
        mfaEnabled: mfaEnabled
      },
      security: {
        vaultPasswordSet: !!localStorage.getItem(`vaultMasterPassword_${user.id}`),
        lastPasswordChange: new Date().toISOString()
      }
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-settings-${user.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert("✅ Settings exported successfully!");
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          
          if (window.confirm("Import these settings? This will overwrite your current settings.")) {
            // Apply imported settings
            if (importedData.vaultSettings) {
              setTheme(importedData.vaultSettings.theme || 'light');
              setNotifications(importedData.vaultSettings.notifications !== false);
              setAutoBackup(importedData.vaultSettings.autoBackup || false);
              setSessionTimeout(importedData.vaultSettings.sessionTimeout || 15);
              setMfaEnabled(importedData.vaultSettings.mfaEnabled || false);
              
              // Save to localStorage
              localStorage.setItem(`theme_${user.id}`, importedData.vaultSettings.theme || 'light');
              localStorage.setItem(`notifications_${user.id}`, importedData.vaultSettings.notifications !== false);
              localStorage.setItem(`autoBackup_${user.id}`, importedData.vaultSettings.autoBackup || false);
              localStorage.setItem(`sessionTimeout_${user.id}`, importedData.vaultSettings.sessionTimeout || 15);
              localStorage.setItem(`mfaEnabled_${user.id}`, importedData.vaultSettings.mfaEnabled || false);
            }
            
            alert("✅ Settings imported successfully!");
            if (onSettingsUpdate) onSettingsUpdate();
          }
        } catch (error) {
          alert("❌ Invalid settings file!");
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleClearData = () => {
    if (window.confirm("🚨 DANGER: This will clear ALL your vault data including encrypted files. This action cannot be undone. Are you absolutely sure?")) {
      if (window.confirm("⚠️ LAST WARNING: This will permanently delete all your files and settings. Type 'DELETE ALL' to confirm.")) {
        const confirmation = prompt("Type 'DELETE ALL' to confirm:");
        if (confirmation === 'DELETE ALL') {
          // Clear all user data
          localStorage.removeItem(`vaultMasterPassword_${user.id}`);
          localStorage.removeItem(`theme_${user.id}`);
          localStorage.removeItem(`notifications_${user.id}`);
          localStorage.removeItem(`autoBackup_${user.id}`);
          localStorage.removeItem(`sessionTimeout_${user.id}`);
          localStorage.removeItem(`mfaEnabled_${user.id}`);
          localStorage.removeItem(`cloudBackup_${user.id}`);
          localStorage.removeItem(`lastBackup_${user.id}`);
          sessionStorage.removeItem('vaultSession');
          
          alert("✅ All data cleared successfully!");
          if (onSettingsUpdate) onSettingsUpdate();
        } else {
          alert("Data deletion cancelled.");
        }
      }
    }
  };

  // 🔓 LOCK VAULT
  const lockVault = () => {
    sessionStorage.removeItem('vaultSession');
    alert("🔒 Vault locked! Enter password to access files.");
  };

  // 🎨 PASSWORD STRENGTH INDICATOR
  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return "#10b981";
    if (passwordStrength >= 50) return "#f59e0b";
    if (passwordStrength >= 25) return "#f97316";
    return "#ef4444";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 75) return "Strong";
    if (passwordStrength >= 50) return "Good";
    if (passwordStrength >= 25) return "Weak";
    return "Very Weak";
  };

  return (
    <div className="settings-container">
      
      {/* HEADER */}
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <div className="header-content">
          <h1>⚙️ Advanced Settings</h1>
          <p>Manage your vault security, appearance, and preferences</p>
        </div>
        <div className="user-badge">
          <User size={16} />
          <span>{user.email}</span>
        </div>
      </div>

      {/* SETTINGS LAYOUT */}
      <div className="settings-layout">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="settings-sidebar">
          <div 
            className={`sidebar-item ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <Shield size={18} />
            Security
            {mfaEnabled && <div className="status-dot active"></div>}
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === "appearance" ? "active" : ""}`}
            onClick={() => setActiveTab("appearance")}
          >
            <Palette size={18} />
            Appearance
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <Bell size={18} />
            Notifications
            {!notifications && <div className="status-dot inactive"></div>}
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === "backup" ? "active" : ""}`}
            onClick={() => setActiveTab("backup")}
          >
            <Database size={18} />
            Backup & Data
            {autoBackup && <div className="status-dot active"></div>}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="settings-content">
          
          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="settings-tab">
              <h2>🔒 Security & Authentication</h2>
              
              <div className="setting-group">
                <h3>Vault Password</h3>
                <p>Change your master vault password for file encryption</p>
                
                <div className="password-form">
                  <div className="input-group">
                    <label>New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          calculatePasswordStrength(e.target.value);
                        }}
                        placeholder="Enter new password (min 8 characters)"
                      />
                      <button 
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    
                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div className="password-strength">
                        <div className="strength-bar">
                          <div 
                            className="strength-fill"
                            style={{
                              width: `${passwordStrength}%`,
                              backgroundColor: getPasswordStrengthColor()
                            }}
                          ></div>
                        </div>
                        <span className="strength-text">
                          Strength: <strong style={{color: getPasswordStrengthColor()}}>
                            {getPasswordStrengthText()}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="input-group">
                    <label>Confirm Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  
                  <button 
                    className="btn-primary"
                    onClick={handlePasswordChange}
                    disabled={!newPassword || !confirmPassword || passwordStrength < 75}
                  >
                    <Key size={16} />
                    Update Password
                  </button>
                </div>
              </div>

              <div className="setting-group">
                <h3>Multi-Factor Authentication</h3>
                <p>Add an extra layer of security to your account</p>
                
                <div className="toggle-group">
                  <div className="toggle-label">
                    <Smartphone size={18} />
                    <div>
                      <label>Enable SMS/App Authentication</label>
                      <span>Require verification code during login</span>
                    </div>
                  </div>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={mfaEnabled}
                      onChange={handleMFAToggle}
                    />
                    <span className="slider"></span>
                  </div>
                </div>
                
                {mfaEnabled && (
                  <div className="mfa-status active">
                    <CheckCircle size={16} />
                    <span>MFA is active on your account</span>
                  </div>
                )}
              </div>

              <div className="setting-group">
                <h3>Session Management</h3>
                <p>Control how long your vault stays unlocked</p>
                
                <div className="session-options">
                  <label>Auto-lock after inactivity</label>
                  <div className="timeout-options">
                    {[5, 15, 30, 60].map((minutes) => (
                      <button
                        key={minutes}
                        className={`timeout-option ${sessionTimeout === minutes ? 'active' : ''}`}
                        onClick={() => handleSessionTimeoutChange(minutes)}
                      >
                        <Clock size={16} />
                        {minutes} min
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  className="btn-secondary"
                  onClick={lockVault}
                >
                  <Lock size={16} />
                  Lock Vault Now
                </button>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === "appearance" && (
            <div className="settings-tab">
              <h2>🎨 Appearance & Interface</h2>
              
              <div className="setting-group">
                <h3>Theme Preferences</h3>
                <p>Choose your preferred interface theme</p>
                
                <div className="theme-options">
                  <div 
                    className={`theme-option ${theme === "light" ? "active" : ""}`}
                    onClick={() => handleThemeChange("light")}
                  >
                    <div className="theme-preview light">
                      <div className="preview-header"></div>
                      <div className="preview-sidebar"></div>
                      <div className="preview-content"></div>
                    </div>
                    <span>Light Mode</span>
                  </div>
                  
                  <div 
                    className={`theme-option ${theme === "dark" ? "active" : ""}`}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <div className="theme-preview dark">
                      <div className="preview-header"></div>
                      <div className="preview-sidebar"></div>
                      <div className="preview-content"></div>
                    </div>
                    <span>Dark Mode</span>
                  </div>
                  
                  <div 
                    className={`theme-option ${theme === "auto" ? "active" : ""}`}
                    onClick={() => handleThemeChange("auto")}
                  >
                    <div className="theme-preview auto">
                      <div className="preview-header"></div>
                      <div className="preview-sidebar"></div>
                      <div className="preview-content"></div>
                    </div>
                    <span>System Default</span>
                  </div>
                </div>
              </div>

              <div className="setting-group">
                <h3>Layout Preferences</h3>
                
                <div className="toggle-group">
                  <div className="toggle-label">
                    <label>Compact file view</label>
                    <span>Show more files in less space</span>
                  </div>
                  <div className="toggle-switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </div>
                </div>
                
                <div className="toggle-group">
                  <div className="toggle-label">
                    <label>Show file previews</label>
                    <span>Display file thumbnails where possible</span>
                  </div>
                  <div className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </div>
                </div>

                <div className="toggle-group">
                  <div className="toggle-label">
                    <label>Sidebar position</label>
                    <span>Left or right sidebar placement</span>
                  </div>
                  <select defaultValue="left">
                    <option value="left">Left Side</option>
                    <option value="right">Right Side</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="settings-tab">
              <h2>🔔 Notifications & Alerts</h2>
              
              <div className="setting-group">
                <h3>Notification Preferences</h3>
                <p>Control how you receive alerts and updates</p>
                
                <div className="toggle-group">
                  <div className="toggle-label">
                    <label>Enable all notifications</label>
                    <span>Receive all system notifications</span>
                  </div>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications}
                      onChange={handleNotificationsToggle}
                    />
                    <span className="slider"></span>
                  </div>
                </div>
                
                <div className="notification-options">
                  <div className="toggle-group">
                    <label>Backup completion alerts</label>
                    <div className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </div>
                  </div>
                  
                  <div className="toggle-group">
                    <label>Security scan results</label>
                    <div className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </div>
                  </div>
                  
                  <div className="toggle-group">
                    <label>New login alerts</label>
                    <div className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </div>
                  </div>

                  <div className="toggle-group">
                    <label>File encryption status</label>
                    <div className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BACKUP & DATA TAB */}
          {activeTab === "backup" && (
            <div className="settings-tab">
              <h2>💾 Backup & Data Management</h2>
              
              <div className="setting-group">
                <h3>Automatic Backup</h3>
                <p>Configure automatic backup settings for your vault</p>
                
                <div className="toggle-group">
                  <div className="toggle-label">
                    <Cloud size={18} />
                    <div>
                      <label>Enable automatic backups</label>
                      <span>Regularly backup your encrypted files to cloud</span>
                    </div>
                  </div>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={autoBackup}
                      onChange={handleAutoBackupToggle}
                    />
                    <span className="slider"></span>
                  </div>
                </div>
                
                {autoBackup && (
                  <div className="backup-schedule">
                    <label>Backup Frequency</label>
                    <select defaultValue="weekly">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    
                    <label>Retention Policy</label>
                    <select defaultValue="30">
                      <option value="7">Keep 7 days</option>
                      <option value="30">Keep 30 days</option>
                      <option value="90">Keep 90 days</option>
                      <option value="365">Keep 1 year</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="setting-group">
                <h3>Data Management</h3>
                <p>Export, import, or clear your vault data</p>
                
                <div className="data-actions">
                  <button className="btn-primary" onClick={handleExportData}>
                    <Download size={16} />
                    Export Settings & Data
                  </button>
                  
                  <button className="btn-secondary" onClick={handleImportData}>
                    <Upload size={16} />
                    Import Settings
                  </button>
                  
                  <button className="btn-danger" onClick={handleClearData}>
                    <LogOut size={16} />
                    Clear All Data
                  </button>
                </div>
                
                <div className="storage-info">
                  <h4>📊 Storage Information</h4>
                  <div className="storage-stats">
                    <div className="storage-stat">
                      <HardDrive size={16} />
                      <span>Total Files: Loading...</span>
                    </div>
                    <div className="storage-stat">
                      <Database size={16} />
                      <span>Storage Used: Loading...</span>
                    </div>
                    <div className="storage-stat">
                      <Cloud size={16} />
                      <span>Last Backup: {localStorage.getItem(`lastBackup_${user.id}`) || 'Never'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;