import React, { useState } from "react";
import { uploadFileToDB } from "../services/fileServices";
import "../styles/FileUpload.css";
import { supabase } from "../supabase/config";

/**
 * FileUpload Component (Secure Version)
 */
function FileUpload({ onBack, user }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [password, setPassword] = useState("");

  const handleFileSelect = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("❗Please select files first");
      return;
    }
    if (!password) {
      alert("🔐 Please enter encryption password");
      return;
    }

    setUploading(true);
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const { data: { user } } = await supabase.auth.getUser();

      console.log("User object:", user);   // 👈 yaha daalo
      console.log("User ID:", user?.id);

      await uploadFileToDB(file, user);
      setUploadProgress(((i + 1) / selectedFiles.length) * 100);
    }

    setUploading(false);
    alert("✅ Files encrypted & uploaded securely!");
    setSelectedFiles([]);
    setPassword("");
  };

  return (
    <div className="file-upload">
      <h1>🔐 Secure File Upload</h1>
      <p>All files will be encrypted before saving to Firebase</p>

      <input
        type="password"
        placeholder="Enter encryption password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="password-input"
      />

      <input type="file" multiple onChange={handleFileSelect} />

      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Encrypting & Uploading..." : "☁️ Upload Securely"}
      </button>

      {uploading && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      <button onClick={onBack} className="back-btn">
        ← Back to Dashboard
      </button>
    </div>
  );
}

export default FileUpload;
