// src/components/Dashboard.jsx - ORIGINAL VERSION (Settings Button REMOVED)
import React, { useState, useEffect } from "react";
import "../styles/Dashboard.css";
import QuickEncrypt from "./QuickEncrypt";
import VaultManager from "./VaultManager";
import CloudBackupManager from "./CloudBackupManager";
import SecurityScan from "./SecurityScan";
import Settings from "./Settings";
import { supabase } from "../supabase/config";
import { LogOut, Lock, Cloud, Shield, Key } from "lucide-react"; // ✅ SettingsIcon REMOVED

function Dashboard({ user, onLogout }) {
  const [currentView, setCurrentView] = useState("dashboard");
  const [showSecurityScan, setShowSecurityScan] = useState(false);
  const [showCloudBackup, setShowCloudBackup] = useState(false);
  const [stats, setStats] = useState({
    totalFiles: 0,
    encryptedFiles: 0,
    storageUsed: 0,
    encryptionLevel: "AES-256",
    cloudBackupStatus: "Inactive",
    vaultStatus: "Not Set"
  });

  useEffect(() => {
    if (user) {
      loadStats(user.id);
      checkVaultStatus(user.id);
    }
  }, [user]);

  const checkVaultStatus = (uid) => {
    if (!uid) return;
    const vaultPassword = localStorage.getItem(`vaultMasterPassword_${uid}`);
    setStats(prev => ({
      ...prev,
      vaultStatus: vaultPassword ? "Active" : "Not Set"
    }));
  };

  const loadStats = async (uid) => {
    try {
      if (!uid) return;
      
      // Load normal files
      const { data: normalFiles } = await supabase.storage
        .from("user-files")
        .list(`${uid}/normal`, { limit: 100 });
      
      // Load encrypted files  
      const { data: encryptedFiles } = await supabase.storage
        .from("user-files")
        .list(`${uid}/encrypted`, { limit: 100 });

      const allFiles = [...(normalFiles || []), ...(encryptedFiles || [])];
      
      const totalSize = allFiles.reduce(
        (sum, file) => sum + (file.metadata?.size || 0),
        0
      );

      const cloudStatus = localStorage.getItem(`cloudBackup_${uid}`) || "Inactive";

      setStats({
        totalFiles: allFiles.length,
        encryptedFiles: encryptedFiles?.length || 0,
        storageUsed: (totalSize / 1024 / 1024).toFixed(2),
        encryptionLevel: "AES-256",
        cloudBackupStatus: cloudStatus,
        vaultStatus: localStorage.getItem(`vaultMasterPassword_${uid}`) ? "Active" : "Not Set"
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Logout?")) return;
    // Clear vault session on logout
    sessionStorage.removeItem('vaultSession');
    await supabase.auth.signOut();
    if (onLogout) onLogout();
  };

  const handleQuickEncrypt = () => setCurrentView("quickEncrypt");
  const handleVaultManager = () => setCurrentView("vaultManager");
  const handleCloudClick = () => setShowCloudBackup(true);
  const handleScanClick = () => setShowSecurityScan(true);

  // ✅ Settings navigation REMOVED from dashboard

  // View Conditions
  if (showSecurityScan)
    return <SecurityScan user={user} onBack={() => setShowSecurityScan(false)} />;

  if (currentView === "quickEncrypt")
    return <QuickEncrypt user={user} onBack={() => setCurrentView("dashboard")} onStatsUpdate={() => loadStats(user?.id)} />;

  if (currentView === "vaultManager")
    return <VaultManager user={user} onBack={() => setCurrentView("dashboard")} onStatsUpdate={() => loadStats(user?.id)} />;

  if (currentView === "settings")
    return <Settings user={user} onBack={() => setCurrentView("dashboard")} />;

  if (showCloudBackup)
    return <CloudBackupManager user={user} onBack={() => setShowCloudBackup(false)} onStatusUpdate={() => loadStats(user?.id)} />;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard__header">
        <div className="header__content">
          <div className="header__info">
            <h1>🛡️ CyberSecure Vault</h1>
            {user && (
              <p className="user__welcome">
                Welcome, <strong>{user.email}</strong> 👋
              </p>
            )}
          </div>

          {/* Quick Actions - ✅ Settings Button REMOVED */}
          <div className="header__quick-actions">
            <button className="quick-action__btn" onClick={handleQuickEncrypt}>
              <Lock size={16} />
              Quick Encrypt
            </button>
            <button className="quick-action__btn" onClick={handleVaultManager}>
              <Key size={16} />
              My Vault
            </button>
            <button className="quick-action__btn" onClick={handleCloudClick}>
              <Cloud size={16} />
              Cloud Backup
            </button>
            <button className="quick-action__btn" onClick={handleScanClick}>
              <Shield size={16} />
              Security Scan
            </button>
            {/* ✅ Settings button COMPLETELY REMOVED from here */}
          </div>

          <button className="logout__btn" onClick={handleLogout}>
            <LogOut className="logout__icon" />
            <span className="logout__text">Logout</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="dashboard__stats">
        <div className="stat__card">
          <div className="stat__icon">📁</div>
          <div className="stat__info">
            <h3>{stats.totalFiles}</h3>
            <p>Total Files</p>
          </div>
        </div>

        <div className="stat__card">
          <div className="stat__icon">🔒</div>
          <div className="stat__info">
            <h3>{stats.encryptedFiles}</h3>
            <p>Encrypted Files</p>
          </div>
        </div>

        <div className="stat__card">
          <div className="stat__icon">💾</div>
          <div className="stat__info">
            <h3>{stats.storageUsed} MB</h3>
            <p>Storage Used</p>
          </div>
        </div>

        <div className="stat__card">
          <div className="stat__icon">🛡️</div>
          <div className="stat__info">
            <h3 className={stats.vaultStatus === "Active" ? "cloud-active" : "cloud-inactive"}>
              {stats.vaultStatus}
            </h3>
            <p>Vault Status</p>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="dashboard__activity">
        <h2>Recent Activity</h2>
        <div className="activity__list">
          {stats.totalFiles > 0 ? (
            <div className="activity__item">
              ✅ {stats.totalFiles} Files in Vault
            </div>
          ) : (
            <div className="activity__item">
              📥 No files — encrypt your first!
            </div>
          )}
          
          <div className="activity__item">
            {stats.vaultStatus === "Active" ? (
              <>🛡️ Vault: <strong style={{color: '#10b981'}}>Protected</strong></>
            ) : (
              <>🛡️ Vault: <strong style={{color: '#ef4444'}}>Setup Required</strong></>
            )}
          </div>

          <div className="activity__item">
            {stats.cloudBackupStatus === "Active" ? (
              <>☁️ Cloud Backup: <strong style={{color: '#10b981'}}>Active</strong></>
            ) : (
              <>☁️ Cloud Backup: <strong style={{color: '#6b7280'}}>Inactive</strong></>
            )}
          </div>

          {user && (
            <div className="activity__item">
              👤 Signed in as {user.email}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;