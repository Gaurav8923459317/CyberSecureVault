// src/components/VaultManager.jsx - VIEW vs DOWNLOAD FIXED
import React, { useState, useEffect } from "react";
import { supabase } from "../supabase/config";
import { cryptoManager } from "../utils/cryptoUtils";
import { ArrowLeft, Download, Trash2, Eye, Lock, Search } from "lucide-react";
import "../styles/VaultManager.css";

const VaultManager = ({ user, onBack, onStatsUpdate }) => {
  const [encryptedFiles, setEncryptedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [filePreview, setFilePreview] = useState(null); // NEW: For file preview

  useEffect(() => {
    loadEncryptedFiles();
  }, [user]);

  const loadEncryptedFiles = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: files, error } = await supabase.storage
        .from("user-files")
        .list(`${user.id}/encrypted`);

      if (error) throw error;
      setEncryptedFiles(files || []);
    } catch (error) {
      console.error("Error loading files:", error);
      setStatus("❌ Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  const checkVaultSession = () => {
    return sessionStorage.getItem('vaultSession') === 'active';
  };

  const verifyVaultPassword = () => {
    const storedPassword = localStorage.getItem(`vaultMasterPassword_${user.id}`);
    if (!storedPassword) return false;
    return password === atob(storedPassword);
  };

  const startVaultSession = () => {
    if (verifyVaultPassword()) {
      sessionStorage.setItem('vaultSession', 'active');
      setShowPasswordModal(false);
      setPassword("");
      
      if (selectedFile) {
        const action = sessionStorage.getItem('pendingAction');
        if (action) {
          performFileAction(selectedFile, action);
          sessionStorage.removeItem('pendingAction');
        }
      }
      return true;
    } else {
      alert("❌ Incorrect vault password");
      return false;
    }
  };

  // PROFESSIONAL DECRYPTION USING CRYPTO UTILS
  const decryptFileData = async (encryptedBlob) => {
    try {
      const vaultPassword = localStorage.getItem(`vaultMasterPassword_${user.id}`);
      if (!vaultPassword) {
        throw new Error("Vault password not found");
      }

      const decryptedPassword = atob(vaultPassword);
      
      // Use professional decryption
      const decryptedResult = await cryptoManager.decryptFile(encryptedBlob, decryptedPassword);
      
      return decryptedResult;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  };

  const handleFileAction = async (file, action) => {
    if (!checkVaultSession()) {
      setSelectedFile(file);
      sessionStorage.setItem('pendingAction', action);
      setShowPasswordModal(true);
      return;
    }

    await performFileAction(file, action);
  };

  // Check if file type can be previewed in browser
  const canPreviewInBrowser = (fileName) => {
    const previewableExtensions = [
      '.txt', '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.html', '.htm', '.svg'
    ];
    return previewableExtensions.some(ext => 
      fileName.toLowerCase().endsWith(ext)
    );
  };

  // Open file in new tab for viewing
  const openFileInNewTab = (blob, fileName, fileType) => {
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      // If popup blocked, download instead
      downloadFile(blob, fileName);
      return false;
    }
    return true;
  };

  const performFileAction = async (file, action) => {
    setIsDecrypting(true);
    setStatus(`Processing ${file.name}...`);

    try {
      // Download encrypted file from Supabase
      const { data: encryptedBlob, error } = await supabase.storage
        .from("user-files")
        .download(`${user.id}/encrypted/${file.name}`);

      if (error) {
        throw new Error(`Download failed: ${error.message}`);
      }

      if (!encryptedBlob) {
        throw new Error("No file data received");
      }

      setStatus(`Decrypting with AES-256...`);

      // PROFESSIONAL DECRYPTION
      const decryptedResult = await decryptFileData(encryptedBlob);
      
      if (!decryptedResult || !decryptedResult.blob) {
        throw new Error("Decryption failed - no result");
      }

      const { blob: decryptedBlob, name: originalName, type: fileType } = decryptedResult;

      if (action === 'view') {
        // VIEW ACTION: Try to open in browser, else download
        const isPreviewable = canPreviewInBrowser(originalName);
        
        if (isPreviewable) {
          const opened = openFileInNewTab(decryptedBlob, originalName, fileType);
          if (opened) {
            setStatus(`✅ ${originalName} opened in new tab`);
          } else {
            downloadFile(decryptedBlob, originalName);
            setStatus(`✅ ${originalName} downloaded (popup blocked)`);
          }
        } else {
          // For non-previewable files, show preview option or download
          setFilePreview({
            blob: decryptedBlob,
            name: originalName,
            type: fileType
          });
          setStatus(`📁 ${originalName} ready - cannot preview this file type`);
        }
        
      } else if (action === 'download') {
        // DOWNLOAD ACTION: Always download
        downloadFile(decryptedBlob, originalName);
        setStatus(`✅ ${originalName} downloaded successfully!`);
      }

    } catch (error) {
      console.error("File action error:", error);
      setStatus(`❌ Operation failed: ${error.message}`);
    } finally {
      setIsDecrypting(false);
      setTimeout(() => setStatus(""), 5000);
    }
  };

  const downloadFile = (blob, fileName) => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      throw new Error("Failed to download file");
    }
  };

  const deleteFile = async (file) => {
    if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) return;

    try {
      const { error } = await supabase.storage
        .from("user-files")
        .remove([`${user.id}/encrypted/${file.name}`]);

      if (error) throw error;

      setEncryptedFiles(prev => prev.filter(f => f.name !== file.name));
      setStatus("✅ File deleted successfully!");
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error("Delete error:", error);
      setStatus("❌ Delete failed");
    }
  };

  const filteredFiles = encryptedFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (fileName) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "🖼️";
    if (fileName.match(/\.(pdf)$/i)) return "📄";
    if (fileName.match(/\.(doc|docx)$/i)) return "📝";
    if (fileName.match(/\.(xls|xlsx)$/i)) return "📊";
    if (fileName.match(/\.(txt)$/i)) return "📃";
    if (fileName.match(/\.(mp4|avi|mov)$/i)) return "🎥";
    if (fileName.match(/\.(mp3|wav)$/i)) return "🎵";
    return "📁";
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="vault-manager">
      {/* Header */}
      <div className="vault-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <div className="header-info">
          <h1>🔐 My Secure Vault</h1>
          <p>AES-256 Encrypted Files - Military Grade Security</p>
        </div>
      </div>

      {/* Controls */}
      <div className="vault-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search encrypted files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="file-count">
          {filteredFiles.length} of {encryptedFiles.length} files
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="password-modal">
          <div className="modal-content">
            <h3>🔒 Enter Vault Password</h3>
            <p>To access {selectedFile?.name}, please enter your vault password</p>
            
            <input
              type="password"
              placeholder="Vault password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && startVaultSession()}
            />
            
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                  setSelectedFile(null);
                  sessionStorage.removeItem('pendingAction');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm"
                onClick={startVaultSession}
              >
                Unlock Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {filePreview && (
        <div className="preview-modal">
          <div className="preview-content">
            <h3>📁 File Ready: {filePreview.name}</h3>
            <p>This file type cannot be previewed in browser. What would you like to do?</p>
            
            <div className="preview-actions">
              <button 
                className="btn-primary"
                onClick={() => {
                  downloadFile(filePreview.blob, filePreview.name);
                  setFilePreview(null);
                  setStatus(`✅ ${filePreview.name} downloaded`);
                }}
              >
                <Download size={16} />
                Download File
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setFilePreview(null)}
              >
                Cancel
              </button>
            </div>
            
            <div className="preview-info">
              <small>Supported preview formats: PDF, Images, Text, HTML</small>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="vault-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading encrypted files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="empty-state">
            <Lock size={48} />
            <h3>No Encrypted Files</h3>
            <p>Your AES-256 encrypted files will appear here</p>
            <button className="back-btn" onClick={onBack}>
              Go to Quick Encrypt
            </button>
          </div>
        ) : (
          <div className="files-grid">
            {filteredFiles.map((file, index) => (
              <div key={file.id || index} className="file-card">
                <div className="file-header">
                  <span className="file-icon">
                    {getFileIcon(file.name)}
                  </span>
                  <div className="file-info">
                    <h4 className="file-name" title={file.name.replace('encrypted_', '')}>
                      {file.name.replace('encrypted_', '')}
                    </h4>
                    <span className="file-size">
                      {formatFileSize(file.metadata?.size || 0)}
                    </span>
                    <span className="file-previewable">
                      {canPreviewInBrowser(file.name) ? "👁️ Previewable" : "📥 Download Only"}
                    </span>
                  </div>
                </div>
                
                <div className="file-actions">
                  <button 
                    className="action-btn view-btn"
                    onClick={() => handleFileAction(file, 'view')}
                    disabled={isDecrypting}
                    title={canPreviewInBrowser(file.name) 
                      ? "Open file in browser" 
                      : "File cannot be previewed"
                    }
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                  <button 
                    className="action-btn download-btn"
                    onClick={() => handleFileAction(file, 'download')}
                    disabled={isDecrypting}
                    title="Download to device"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => deleteFile(file)}
                    disabled={isDecrypting}
                    title="Delete file permanently"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="file-status">
                  <Lock size={12} />
                  <span>AES-256 Encrypted</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Message */}
        {status && (
          <div className={`status-message ${status.includes('❌') ? 'error' : 'success'}`}>
            {status}
          </div>
        )}

        {/* Decrypting Overlay */}
        {isDecrypting && (
          <div className="decrypting-overlay">
            <div className="decrypting-content">
              <div className="decrypting-spinner"></div>
              <p>Decrypting with AES-256...</p>
              <span>Military-grade security in action</span>
            </div>
          </div>
        )}
      </div>

      {/* Vault Session Status */}
      <div className="vault-status">
        {checkVaultSession() ? (
          <div className="session-active">
            <Lock size={16} />
            Vault unlocked • AES-256 Active
          </div>
        ) : (
          <div className="session-locked">
            <Lock size={16} />
            Vault locked • Enter password to access files
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="usage-instructions">
        <h4>📖 How to Use:</h4>
        <div className="instruction-grid">
          <div className="instruction">
            <strong>👁️ View</strong>
            <span>Opens file in browser (PDF, Images, Text)</span>
          </div>
          <div className="instruction">
            <strong>💾 Download</strong>
            <span>Saves file to your device</span>
          </div>
          <div className="instruction">
            <strong>🗑️ Delete</strong>
            <span>Permanently removes from vault</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultManager;