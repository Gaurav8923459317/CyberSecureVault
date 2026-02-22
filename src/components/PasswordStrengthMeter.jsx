// src/components/PasswordStrengthMeter.jsx
import React, { useState, useEffect } from "react";
import { cryptoManager } from "../utils/cryptoUtils";

const PasswordStrengthMeter = ({ password = "", onPasswordChange }) => {
  const [strength, setStrength] = useState({ isValid: false, score: 0 });

  useEffect(() => {
    const s = cryptoManager.validatePasswordStrength(password);
    setStrength(s);
    if (onPasswordChange) onPasswordChange(password, s);
  }, [password]);

  const handleChange = (e) => {
    const val = e.target.value;
    const s = cryptoManager.validatePasswordStrength(val);
    setStrength(s);
    if (onPasswordChange) onPasswordChange(val, s);
  };

  const getStrengthLabel = () => {
    const { score } = strength;
    if (score === 0) return "Very Weak";
    if (score === 1) return "Weak";
    if (score === 2) return "Fair";
    if (score === 3) return "Good";
    return "Strong";
  };

  return (
    <div style={{ width: "100%", marginTop: "1rem", textAlign: "left" }}>
      <label style={{ fontWeight: "600", color: "#1e293b" }}>
        Encryption Password
      </label>
      <input
        type="password"
        placeholder="Enter strong password..."
        value={password}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          marginTop: "0.5rem",
        }}
      />
      <div
        style={{
          marginTop: "0.5rem",
          fontSize: "0.9rem",
          fontWeight: 500,
          color: strength.isValid ? "#059669" : "#dc2626",
        }}
      >
        {getStrengthLabel()}
      </div>
      <div
        style={{
          marginTop: "5px",
          height: "8px",
          width: "100%",
          background: "#e2e8f0",
          borderRadius: "5px",
        }}
      >
        <div
          style={{
            width: `${(strength.score / 4) * 100}%`,
            height: "100%",
            background: strength.isValid ? "#10b981" : "#f97316",
            borderRadius: "5px",
            transition: "width 0.3s ease",
          }}
        ></div>
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
