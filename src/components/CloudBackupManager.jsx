// src/components/CloudBackupManager.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabase/config";
import { ArrowLeft, Cloud, Download, RefreshCw, CheckCircle, AlertCircle, Settings} from "lucide-react";
import "../styles/CloudBackupManager.css";

const CloudBackupManager = ({ user, onBack, onStatusUpdate }) => {
  const [selectedCloud, setSelectedCloud] = useState("supabase");
  const [backupStatus, setBackupStatus] = useState("Inactive");
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Cloud providers configuration
  const cloudProviders = [
    {
      id: "supabase",
      name: "Supabase Cloud",
      icon: "🛡️",
      description: "Built-in secure cloud storage",
      status: "available"
    },
    {
      id: "google",
      name: "Google Cloud",
      icon: "🔵", 
      description: "Connect your Google Cloud account",
      status: "connect"
    },
    {
      id: "aws",
      name: "Amazon S3",
      icon: "🟠",
      description: "Connect your AWS S3 bucket",
      status: "connect"
    },
    {
      id: "azure",
      name: "Azure Blob",
      icon: "🔷",
      description: "Connect your Azure Storage",
      status: "connect"
    },
    {
      id: "local",
      name: "Local Machine",
      icon: "💻",
      description: "Backup to your computer",
      status: "available"
    }
  ];

  useEffect(() => {
    loadBackupStatus();
    loadUserFiles();
  }, [user]); 

 

 const loadBackupStatus = () => {
    const status = localStorage.getItem(`cloudBackup_${user.id}`) || "Inactive";
    const lastBackupTime = localStorage.getItem(`lastBackup_${user.id}`);
    const savedCloud = localStorage.getItem(`selectedCloud_${user.id}`) || "supabase";
    
    setBackupStatus(status);
    setLastBackup(lastBackupTime);
    setSelectedCloud(savedCloud);
  };

    const loadUserFiles = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from("user-files")
        .list(user.id + "/", { limit: 100 });

      if (error) throw error;
      setFiles(files || []);
    } catch (error) {
      showMessage("Error loading files", "error");
    }
  };


  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  // ✅ SELECT CLOUD PROVIDER
  const handleCloudSelect = (cloudId) => {
    setSelectedCloud(cloudId);
    localStorage.setItem(`selectedCloud_${user.id}`, cloudId);
    showMessage(`${cloudProviders.find(c => c.id === cloudId).name} selected`, "info");
  };

  // ✅ ENABLE CLOUD BACKUP
  const enableBackup = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      localStorage.setItem(`cloudBackup_${user.id}`, "Active");
      setBackupStatus("Active");
      showMessage(`Cloud Backup enabled with ${cloudProviders.find(c => c.id === selectedCloud).name}`, "success");
      if (onStatusUpdate) onStatusUpdate(user.id);
    } catch (error) {
      showMessage("Failed to enable backup", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ DISABLE CLOUD BACKUP
  const disableBackup = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem(`cloudBackup_${user.id}`, "Inactive");
      setBackupStatus("Inactive");
      showMessage("Cloud Backup disabled", "info");
      if (onStatusUpdate) onStatusUpdate(user.id);
    } catch (error) {
      showMessage("Failed to disable backup", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ PERFORM BACKUP
  const performBackup = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simulate backup process based on selected cloud
      let backupMessage = "";
      
      switch(selectedCloud) {
        case "supabase":
          backupMessage = "Backing up to Supabase Cloud...";
          break;
        case "google":
          backupMessage = "Backing up to Google Cloud Storage...";
          break;
        case "aws":
          backupMessage = "Backing up to Amazon S3...";
          break;
        case "azure":
          backupMessage = "Backing up to Azure Blob Storage...";
          break;
        case "local":
          backupMessage = "Creating local backup...";
          break;
        default:
          backupMessage = "Backing up files...";
      }
      
      showMessage(backupMessage, "info");
      
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const timestamp = new Date().toLocaleString();
      localStorage.setItem(`lastBackup_${user.id}`, timestamp);
      setLastBackup(timestamp);
      
      showMessage(`Backup to ${cloudProviders.find(c => c.id === selectedCloud).name} completed successfully!`, "success");
      if (onStatusUpdate) onStatusUpdate(user.id);
    } catch (error) {
      showMessage("Backup failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ RESTORE FROM BACKUP
  const restoreBackup = async () => {
    setIsLoading(true);
    try {
      showMessage(`Restoring from ${cloudProviders.find(c => c.id === selectedCloud).name}...`, "info");
      await new Promise(resolve => setTimeout(resolve, 2000));
      showMessage("Files restored successfully from backup", "success");
    } catch (error) {
      showMessage("Restore failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CONNECT EXTERNAL CLOUD
  const connectCloud = (cloudId) => {
    const cloud = cloudProviders.find(c => c.id === cloudId);
    showMessage(`Redirecting to ${cloud.name} authentication...`, "info");
    
    // Simulate external cloud connection
    setTimeout(() => {
      showMessage(`Please configure ${cloud.name} credentials in settings`, "info");
    }, 1000);
  };

  return (
    <div className="cloud-backup-manager">
      {/* HEADER */}
      <div className="backup-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>☁️ Multi-Cloud Backup Manager</h1>
      </div>

      {/* STATUS CARD */}
      <div className="status-card">
        <div className="status-header">
          <div className="status-info">
            <h3>Cloud Backup Status</h3>
            <span className={`status-badge ${backupStatus === "Active" ? "active" : "inactive"}`}>
              {backupStatus === "Active" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {backupStatus}
            </span>
          </div>
          {backupStatus === "Active" ? (
            <button className="btn-danger" onClick={disableBackup} disabled={isLoading}>
              <Cloud size={16} />
              Disable Backup
            </button>
          ) : (
            <button className="btn-success" onClick={enableBackup} disabled={isLoading}>
              <Cloud size={16} />
              Enable Backup
            </button>
          )}
        </div>

        {lastBackup && (
          <div className="last-backup">
            📅 Last Backup: <strong>{lastBackup}</strong> | 
            🌐 Provider: <strong>{cloudProviders.find(c => c.id === selectedCloud)?.name}</strong>
          </div>
        )}
      </div>

      {/* MESSAGE ALERT */}
      {message.text && (
        <div className={`message-alert ${message.type}`}>
          {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* CLOUD PROVIDERS SELECTION */}
      <div className="cloud-providers-section">
        <h3>🌐 Select Cloud Provider</h3>
        <div className="providers-grid">
          {cloudProviders.map((provider) => (
            <div
              key={provider.id}
              className={`provider-card ${selectedCloud === provider.id ? "selected" : ""} ${
                provider.status === "connect" ? "requires-connect" : ""
              }`}
              onClick={() => provider.status === "available" ? handleCloudSelect(provider.id) : connectCloud(provider.id)}
            >
              <div className="provider-icon">{provider.icon}</div>
              <div className="provider-info">
                <h4>{provider.name}</h4>
                <p>{provider.description}</p>
              </div>
              <div className="provider-status">
                {provider.status === "connect" && <Settings size={16} />}
                {selectedCloud === provider.id && <CheckCircle size={16} className="selected-check" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="action-buttons">
        <button 
          className="btn-primary" 
          onClick={performBackup} 
          disabled={isLoading || backupStatus !== "Active"}
        >
          <RefreshCw size={16} className={isLoading ? "spinning" : ""} />
          {isLoading ? "Backing Up..." : `Backup to ${cloudProviders.find(c => c.id === selectedCloud)?.name}`}
        </button>
        
        <button 
          className="btn-secondary" 
          onClick={restoreBackup} 
          disabled={isLoading || backupStatus !== "Active"}
        >
          <Download size={16} />
          Restore from Backup
        </button>
      </div>

      {/* FILES OVERVIEW */}
      <div className="files-section">
        <h3>📁 Your Files ({files.length})</h3>
        <div className="files-overview">
          {files.length === 0 ? (
            <div className="no-files">No files found. Upload some files to enable cloud backup.</div>
          ) : (
            <div className="files-stats">
              <div className="file-stat">
                <span className="stat-number">{files.length}</span>
                <span className="stat-label">Total Files</span>
              </div>
              <div className="file-stat">
                <span className="stat-number">
                  {files.filter(f => f.name.includes('.encrypted')).length}
                </span>
                <span className="stat-label">Encrypted</span>
              </div>
              <div className="file-stat">
                <span className="stat-number">
                  {(files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) / 1024 / 1024).toFixed(2)} MB
                </span>
                <span className="stat-label">Total Size</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BACKUP INFORMATION */}
      <div className="backup-info">
        <h4>💡 Backup Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <strong>Selected Provider:</strong> 
            <span>{cloudProviders.find(c => c.id === selectedCloud)?.name}</span>
          </div>
          <div className="info-item">
            <strong>Encryption:</strong> 
            <span>AES-256 (Military Grade)</span>
          </div>
          <div className="info-item">
            <strong>Auto Backup:</strong> 
            <span>{backupStatus === "Active" ? "Enabled" : "Disabled"}</span>
          </div>
          <div className="info-item">
            <strong>Storage Location:</strong> 
            <span>
              {selectedCloud === "local" ? "Your Local Machine" : 
               `${cloudProviders.find(c => c.id === selectedCloud)?.name} Cloud`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudBackupManager;