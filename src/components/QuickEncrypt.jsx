// src/components/QuickEncrypt.jsx - CLEAN & ORGANIZED VERSION
import React, { useState, useRef } from "react";
import { supabase } from "../supabase/config";
import { cryptoManager } from "../utils/cryptoUtils";
import "../styles/QuickEncrypt.css";

const QuickEncrypt = ({ user, onBack, onStatsUpdate }) => {
  // ========== STATE VARIABLES ==========
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [currentFile, setCurrentFile] = useState("");
  
  // File input reference
  const fileInputRef = useRef(null);

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Check if vault is set up for the current user
   */
  const isVaultSetup = () => {
    if (!user) return false;
    return localStorage.getItem(`vaultMasterPassword_${user.id}`);
  };

  /**
   * Validate if file type is supported
   */
  const isFileTypeSupported = (file) => {
    const supportedTypes = [
      'image/', 'application/', 'text/', 
      'video/', 'audio/', 'font/',
      'pdf', 'doc', 'docx', 'xls', 'xlsx'
    ];
    return supportedTypes.some(type => file.type.includes(type) || file.name.includes(type));
  };

  /**
   * Calculate total size of selected files
   */
  const getTotalSize = () => {
    const totalBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    return (totalBytes / 1024 / 1024).toFixed(2);
  };

  // ========== FILE MANAGEMENT FUNCTIONS ==========

  /**
   * Handle file selection from input
   */
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Filter valid files
    const validFiles = files.filter(file => {
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setStatus(`❌ ${file.name} is too large (max 100MB)`);
        return false;
      }
      
      // Check file type support
      if (!isFileTypeSupported(file)) {
        setStatus(`❌ ${file.name} file type not supported`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) {
      setStatus("❌ No valid files selected");
      return;
    }

    // Remove duplicate files
    const newFiles = validFiles.filter(newFile => 
      !selectedFiles.some(existingFile => 
        existingFile.name === newFile.name && existingFile.size === newFile.size
      )
    );

    if (newFiles.length === 0) {
      setStatus("❌ Some files are already selected");
      return;
    }

    // Add new files to selection
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setShowOptions(true);
    setStatus(`✅ ${newFiles.length} files added`);
  };

  /**
   * Remove individual file from selection
   */
  const removeFile = (index) => {
    const fileToRemove = selectedFiles[index];
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setStatus(`🗑️ Removed ${fileToRemove.name}`);
    
    // Hide options if no files left
    if (selectedFiles.length === 1) {
      setShowOptions(false);
    }
  };

  /**
   * Clear all selected files
   */
  const clearFiles = () => {
    setSelectedFiles([]);
    setShowOptions(false);
    setStatus("🗑️ All files cleared");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ========== ENCRYPTION FUNCTIONS ==========

  /**
   * Encrypt a single file using AES-256
   */
  const encryptFile = async (file) => {
    try {
      const vaultPassword = localStorage.getItem(`vaultMasterPassword_${user.id}`);
      if (!vaultPassword) {
        throw new Error("Vault password not found. Please set up vault first.");
      }

      const decryptedPassword = atob(vaultPassword);
      
      // Use professional encryption from cryptoUtils
      const encryptedResult = await cryptoManager.encryptFile(file, decryptedPassword);
      
      // Serialize for storage
      const encryptedBlob = cryptoManager.serializeEncryptedFile(encryptedResult);
      
      return encryptedBlob;
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  };

  /**
   * Handle overwrite modal decision
   */
  const handleOverwriteDecision = (shouldOverwrite) => {
    setShowOverwriteModal(false);
    
    if (shouldOverwrite && pendingAction) {
      encryptAndSaveToVault(true);
    }
    setPendingAction(null);
  };

  // ========== MAIN ENCRYPTION ACTIONS ==========

  /**
   * Encrypt and save files to vault (Supabase storage)
   */
  const encryptAndSaveToVault = async (forceOverwrite = false) => {
    // Validation checks
    if (!isVaultSetup()) {
      setStatus("🔐 Please set up your vault first in Settings");
      return;
    }

    if (selectedFiles.length === 0) {
      setStatus("📁 Please select files first");
      return;
    }

    // Initialize processing state
    setIsProcessing(true);
    setProgress(0);
    setStatus("Starting professional encryption...");
    setCurrentFile("");

    try {
      let processedCount = 0;
      let failedCount = 0;
      const totalFiles = selectedFiles.length;

      // Process each file sequentially
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setCurrentFile(file.name);
        
        // Check for existing files (unless force overwrite)
        if (!forceOverwrite) {
          setStatus(`Checking if ${file.name} exists in vault...`);
          const { data: existingFiles, error: listError } = await supabase.storage
            .from("user-files")
            .list(`${user.id}/encrypted`);
          
          if (listError) {
            console.error("Error checking existing files:", listError);
            setStatus(`⚠️ Could not check existing files`);
          }
          
          const fileExists = existingFiles?.some(f => f.name === `encrypted_${file.name}`);
          
          if (fileExists) {
            setPendingAction({ type: 'saveToVault', file: file });
            setShowOverwriteModal(true);
            setIsProcessing(false);
            setCurrentFile("");
            return;
          }
        }

        // Encryption phase
        setStatus(`Encrypting ${file.name} with AES-256...`);
        setProgress((i / totalFiles) * 50);

        let encryptedBlob;
        try {
          encryptedBlob = await encryptFile(file);
          setStatus(`✅ ${file.name} encrypted securely`);
        } catch (encryptError) {
          console.error(`Encryption failed for ${file.name}:`, encryptError);
          setStatus(`❌ Failed to encrypt ${file.name}: ${encryptError.message}`);
          failedCount++;
          continue; // Skip to next file
        }
        
        // Upload phase
        setStatus(`Uploading ${file.name} to secure vault...`);
        setProgress(((i + 0.5) / totalFiles) * 100);

        const encryptedFile = new File(
          [encryptedBlob],
          `encrypted_${file.name}`,
          { type: "application/encrypted-file" }
        );

        const { error: uploadError } = await supabase.storage
          .from("user-files")
          .upload(`${user.id}/encrypted/${encryptedFile.name}`, encryptedFile, {
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload failed for ${file.name}:`, uploadError);
          setStatus(`❌ Failed to upload ${file.name}`);
          failedCount++;
          continue; // Skip to next file
        }

        // Success
        processedCount++;
        setProgress(((i + 1) / totalFiles) * 100);
        setStatus(`✅ ${file.name} securely saved to vault`);
      }

      // Final status summary
      if (processedCount > 0) {
        if (failedCount > 0) {
          setStatus(`✅ ${processedCount} files secured, ${failedCount} failed`);
        } else {
          setStatus(`✅ All ${processedCount} files encrypted with military-grade AES-256!`);
        }
      } else {
        setStatus("❌ No files were processed successfully");
      }

      // Reset state after delay
      setTimeout(() => {
        setIsProcessing(false);
        setSelectedFiles([]);
        setShowOptions(false);
        setCurrentFile("");
        setProgress(0);
        if (onStatsUpdate) onStatsUpdate();
      }, 3000);

    } catch (error) {
      console.error("Upload error:", error);
      setStatus("❌ Failed to save files to vault");
      setIsProcessing(false);
      setCurrentFile("");
    }
  };

  /**
   * Encrypt and download files locally
   */
  const encryptAndDownload = async () => {
    // Validation checks
    if (selectedFiles.length === 0) {
      setStatus("📁 Please select files first");
      return;
    }

    // Initialize processing state
    setIsProcessing(true);
    setProgress(0);
    setStatus("Starting professional encryption...");
    setCurrentFile("");

    try {
      let processedCount = 0;
      let failedCount = 0;
      const totalFiles = selectedFiles.length;

      // Process each file sequentially
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setCurrentFile(file.name);
        setStatus(`Encrypting ${file.name} with AES-256...`);
        setProgress((i / totalFiles) * 50);

        // Encryption
        let encryptedBlob;
        try {
          encryptedBlob = await encryptFile(file);
        } catch (encryptError) {
          console.error(`Encryption failed for ${file.name}:`, encryptError);
          setStatus(`❌ Failed to encrypt ${file.name}`);
          failedCount++;
          continue;
        }
        
        setProgress(((i + 1) / totalFiles) * 100);

        // Download
        try {
          const url = URL.createObjectURL(encryptedBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `encrypted_${file.name}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          processedCount++;
          setStatus(`✅ ${file.name} encrypted and downloaded`);
        } catch (downloadError) {
          console.error(`Download failed for ${file.name}:`, downloadError);
          setStatus(`❌ Failed to download ${file.name}`);
          failedCount++;
        }
      }

      // Final status summary
      if (processedCount > 0) {
        if (failedCount > 0) {
          setStatus(`✅ ${processedCount} files encrypted, ${failedCount} failed`);
        } else {
          setStatus(`✅ All ${processedCount} files encrypted with AES-256 and downloaded!`);
        }
      } else {
        setStatus("❌ No files were processed successfully");
      }

      // Reset state after delay
      setTimeout(() => {
        setIsProcessing(false);
        setSelectedFiles([]);
        setShowOptions(false);
        setCurrentFile("");
        setProgress(0);
      }, 3000);

    } catch (error) {
      console.error("Download error:", error);
      setStatus("❌ Failed to encrypt files for download");
      setIsProcessing(false);
      setCurrentFile("");
    }
  };

  // ========== RENDER COMPONENT ==========
  return (
    <div className="quick-encrypt">
      
      {/* HEADER SECTION */}
      <div className="encrypt-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>⚡ Quick Encrypt</h1>
        <p>Secure your files with military-grade AES-256 encryption</p>
      </div>

      {/* OVERWRITE MODAL */}
      {showOverwriteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">⚠️</div>
            <h3>File Already Exists</h3>
            <p>"{pendingAction?.file?.name}" already exists in your vault. Overwrite?</p>
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => handleOverwriteDecision(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={() => handleOverwriteDecision(true)}
              >
                Overwrite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT SECTION */}
      <div className="encrypt-content">
        
        {/* FILE SELECTION VIEW */}
        {!showOptions ? (
          <div className="file-select-section">
            <div className="upload-card">
              <div className="upload-icon">🔒</div>
              <h2>Military-Grade File Encryption</h2>
              <p>Protect your files with AES-256 encryption - the same standard used by governments</p>
              
              <div className="upload-features">
                <div className="feature">✅ AES-256 Military Encryption</div>
                <div className="feature">✅ 100MB file size limit</div>
                <div className="feature">✅ All file types supported</div>
                <div className="feature">✅ Secure key derivation</div>
              </div>
              
              {/* Hidden file input */}
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="file-input"
                ref={fileInputRef}
                id="quick-encrypt-input"
              />
              
              {/* File selection trigger */}
              <label htmlFor="quick-encrypt-input" className="file-select-btn">
                📁 Choose Files
              </label>
              
              <div className="upload-hint">
                Select multiple files by holding Ctrl (Windows) or Cmd (Mac)
              </div>
            </div>
          </div>
        ) : (
          
          
          <div className="options-section">
            
            {/* SELECTED FILES SUMMARY */}
            <div className="files-summary">
              <h3>📦 Files Ready for AES-256 Encryption</h3>
              <div className="summary-stats">
                <span>{selectedFiles.length} files selected</span>
                <span>{getTotalSize()} MB total</span>
              </div>
            </div>

            {/* SELECTED FILES LIST */}
            <div className="selected-files">
              <div className="files-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <span className="file-icon">📄</span>
                      <div className="file-details">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    {/* Individual file remove button */}
                    <button 
                      className="remove-btn"
                      onClick={() => removeFile(index)}
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Clear all files option */}
              <div className="files-actions">
                <button className="clear-btn" onClick={clearFiles}>
                  🗑️ Clear All Files
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="action-buttons">
              
              {/* Save to Vault Button */}
              <button 
                className="action-btn vault-btn"
                onClick={() => encryptAndSaveToVault()}
                disabled={isProcessing || !isVaultSetup()}
              >
                <div className="btn-icon">🏰</div>
                <div className="btn-content">
                  <strong>Save to Secure Vault</strong>
                  <span>AES-256 encrypt and store in vault</span>
                </div>
                {!isVaultSetup() && (
                  <span className="setup-warning">Vault Setup Required</span>
                )}
              </button>

              {/* Encrypt & Download Button */}
              <button 
                className="action-btn download-btn"
                onClick={encryptAndDownload}
                disabled={isProcessing}
              >
                <div className="btn-icon">💾</div>
                <div className="btn-content">
                  <strong>Encrypt & Download</strong>
                  <span>AES-256 encrypt and download locally</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PROGRESS INDICATOR */}
        {isProcessing && (
          <div className="progress-section">
            <div className="progress-card">
              <div className="progress-header">
                <h4>AES-256 Encryption in Progress</h4>
                <span className="progress-percent">{progress.toFixed(0)}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {currentFile && (
                <p className="current-file">Processing: {currentFile}</p>
              )}
              <p className="status-text">{status}</p>
            </div>
          </div>
        )}

        {/* STATUS MESSAGE */}
        {status && !isProcessing && (
          <div className={`status-message ${status.includes('❌') ? 'error' : status.includes('✅') ? 'success' : 'info'}`}>
            {status}
          </div>
        )}

        {/* VAULT SETUP WARNING */}
        {!isVaultSetup() && !showOptions && (
          <div className="vault-warning">
            <div className="warning-card">
              <div className="warning-icon">🔐</div>
              <div className="warning-content">
                <h4>Vault Not Set Up</h4>
                <p>Set up your vault password in Settings to use military-grade encryption</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickEncrypt;