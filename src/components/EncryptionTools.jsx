// ======================================
// 🔐 EncryptionTools.jsx — FIXED & SECURE
// ======================================
import React, { useState } from "react";
import "../styles/EncryptionTools.css";
import { useAuth } from "../context/AuthContext";
import { uploadFileToDB } from "../services/fileServices";
import { cryptoManager } from "../utils/cryptoUtils";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

const EncryptionTools = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false });
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [status, setStatus] = useState("");

  // 📂 File Selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setStatus("");
  };

  // 🧠 Password Strength Handler
  const handlePasswordChange = (value, strength) => {
    setPassword(value);
    setPasswordStrength(strength);
  };

  // 🔐 Encrypt & Upload
  const handleEncrypt = async () => {
    if (!selectedFile || !password) {
      alert("⚠️ Please select a file and enter password!");
      return;
    }

    if (!passwordStrength.isValid) {
      alert("⚠️ Please use a stronger password!");
      return;
    }

    if (!currentUser) {
      alert("⚠️ Please log in first!");
      return;
    }

    try {
      setEncryptionProgress(25);
      setStatus("🔄 Encrypting your file...");

      // Step 1: Encrypt the file
      const encryptedBlob = await cryptoManager.encryptFile(selectedFile, password);
      if (!encryptedBlob) throw new Error("Encryption failed!");

      setEncryptionProgress(60);
      setStatus("⏫ Preparing file for upload...");

      // Step 2: Convert Blob → File
      const encryptedFile = new File(
        [encryptedBlob],
        `encrypted_${selectedFile.name}.secure`,
        { type: "application/octet-stream" }
      );

      // Step 3: Upload to Firebase
      await uploadFileToDB(encryptedFile, currentUser);

      setEncryptionProgress(100);
      setStatus("✅ File encrypted and uploaded successfully!");

      // Step 4: Reset after 2.5 sec
      setTimeout(() => {
        setSelectedFile(null);
        setPassword("");
        setEncryptionProgress(0);
        setStatus("");
      }, 2500);
    } catch (error) {
      console.error("❌ Encryption/Upload error:", error);
      setStatus("Upload failed. Try again!");
      alert(`❌ ${error.message}`);
      setEncryptionProgress(0);
    }
  };

  return (
    <div className="encryption-tools-container">

      {/* ✅ ADDED BACK BUTTON — ONLY NEW CHANGE */}
      <button className="back-btn" onClick={onBack}>
        ← Back to Dashboard
      </button>

      <div className="encrypt-card">
        <h2>🔐 Encrypt & Upload File</h2>
        <p>Encrypt your file locally and store it securely on Firebase.</p>

        {/* File Input */}
        <div className="file-input-section">
          <input type="file" onChange={handleFileChange} />
          {selectedFile && <p>📁 Selected: {selectedFile.name}</p>}
        </div>

        {/* Password Strength */}
        <PasswordStrengthMeter
          password={password}
          onPasswordChange={handlePasswordChange}
        />

        {/* Encrypt Button */}
        <button
          className="encrypt-btn"
          onClick={handleEncrypt}
          disabled={!selectedFile || !passwordStrength.isValid}
        >
          Encrypt & Upload
        </button>

        {/* Progress Bar */}
        {encryptionProgress > 0 && (
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${encryptionProgress}%` }}
            ></div>
          </div>
        )}

        {/* Status Message */}
        {status && <p className="status-message">{status}</p>}
      </div>
    </div>
  );
};

export default EncryptionTools;
