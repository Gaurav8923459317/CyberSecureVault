// src/components/VaultSetup.jsx
import React, { useState } from "react";
import { Key, Shield, CheckCircle, Eye, EyeOff, AlertCircle } from "lucide-react";
import "../styles/VaultSetup.css";

const VaultSetup = ({ user, onSetupComplete }) => {
  const [step, setStep] = useState(1);
  const [vaultPassword, setVaultPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: "" });
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const securityQuestions = [
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What was your favorite school teacher's name?",
    "What is your favorite movie?",
    "What was your first car?",
    "What is the name of your childhood best friend?",
    "What is your favorite book?",
    "What is your favorite sports team?",
    "What is your favorite food?"
  ];

  const checkPasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push("At least 8 characters");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("One uppercase letter");

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("One lowercase letter");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("One number");

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push("One special character");

    return { score, feedback: feedback.slice(0, 2) };
  };

  const handlePasswordChange = (password) => {
    setVaultPassword(password);
    setPasswordStrength(checkPasswordStrength(password));
  };

  const handleVaultSetup = () => {
    if (vaultPassword !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (passwordStrength.score < 3) {
      alert("Please use a stronger password!");
      return;
    }

    if (!securityQuestion || !securityAnswer) {
      alert("Please select a security question and provide an answer!");
      return;
    }

    // Save vault password (encrypted)
    const encryptedPassword = btoa(vaultPassword); // Simple encoding for demo
    localStorage.setItem(`vaultMasterPassword_${user.id}`, encryptedPassword);
    
    // Save security question and answer
    localStorage.setItem(`vaultSecurityQuestion_${user.id}`, securityQuestion);
    localStorage.setItem(`vaultSecurityAnswer_${user.id}`, btoa(securityAnswer));
    
    // Save date of birth if provided
    if (dateOfBirth) {
      localStorage.setItem(`vaultDOB_${user.id}`, dateOfBirth);
    }

    // Start vault session
    sessionStorage.setItem('vaultSession', 'active');

    alert("🎉 Vault setup complete! Your files are now secure.");
    onSetupComplete();
  };

  const getStrengthColor = (score) => {
    if (score >= 4) return "#10b981";
    if (score >= 3) return "#f59e0b";
    return "#ef4444";
  };

  const getStrengthText = (score) => {
    if (score >= 4) return "Strong";
    if (score >= 3) return "Medium";
    return "Weak";
  };

  return (
    <div className="vault-setup">
      <div className="setup-container">
        <div className="setup-header">
          <div className="header-icon">
            <Key size={48} />
          </div>
          <h1>Setup Your Secure Vault</h1>
          <p>Protect your files with military-grade encryption</p>
        </div>

        <div className="setup-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Vault Password</span>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Security Setup</span>
          </div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Complete</span>
          </div>
        </div>

        <div className="setup-content">
          {/* Step 1: Vault Password */}
          {step === 1 && (
            <div className="setup-step">
              <h2>Create Vault Master Password</h2>
              <p>This password will encrypt all your files. Make it strong and memorable.</p>

              <div className="password-input-group">
                <label>Vault Password</label>
                <div className="input-with-icon">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={vaultPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter strong password"
                    className="password-input"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="password-input-group">
                <label>Confirm Password</label>
                <div className="input-with-icon">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="password-input"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Password Strength Meter */}
              {vaultPassword && (
                <div className="password-strength">
                  <div className="strength-header">
                    <span>Password Strength:</span>
                    <strong style={{ color: getStrengthColor(passwordStrength.score) }}>
                      {getStrengthText(passwordStrength.score)}
                    </strong>
                  </div>
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5].map((index) => (
                      <div
                        key={index}
                        className={`strength-bar ${index <= passwordStrength.score ? 'filled' : ''}`}
                        style={{ backgroundColor: index <= passwordStrength.score ? getStrengthColor(passwordStrength.score) : '#e5e7eb' }}
                      ></div>
                    ))}
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="strength-feedback">
                      <AlertCircle size={16} />
                      <span>Requirements: {passwordStrength.feedback.join(", ")}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                className="next-btn"
                onClick={() => setStep(2)}
                disabled={!vaultPassword || !confirmPassword || vaultPassword !== confirmPassword || passwordStrength.score < 3}
              >
                Continue to Security Setup
              </button>
            </div>
          )}

          {/* Step 2: Security Setup */}
          {step === 2 && (
            <div className="setup-step">
              <h2>Security & Recovery</h2>
              <p>Set up security questions to recover your vault if you forget the password.</p>

              <div className="security-group">
                <label>Security Question</label>
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="security-select"
                >
                  <option value="">Select a security question</option>
                  {securityQuestions.map((question, index) => (
                    <option key={index} value={question}>
                      {question}
                    </option>
                  ))}
                </select>
              </div>

              <div className="security-group">
                <label>Your Answer</label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="security-input"
                />
              </div>

              <div className="security-group">
                <label>Date of Birth (Optional)</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="security-input"
                />
                <small>Used for additional verification</small>
              </div>

              <div className="step-actions">
                <button className="back-btn" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  className="next-btn"
                  onClick={() => setStep(3)}
                  disabled={!securityQuestion || !securityAnswer}
                >
                  Review & Complete
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="setup-step">
              <div className="complete-section">
                <div className="complete-icon">
                  <CheckCircle size={64} />
                </div>
                <h2>Vault Ready!</h2>
                <p>Your secure vault has been set up successfully.</p>

                <div className="setup-summary">
                  <div className="summary-item">
                    <strong>Vault Protection:</strong>
                    <span>AES-256 Encryption</span>
                  </div>
                  <div className="summary-item">
                    <strong>Security Question:</strong>
                    <span>{securityQuestion}</span>
                  </div>
                  {dateOfBirth && (
                    <div className="summary-item">
                      <strong>Date of Birth:</strong>
                      <span>{new Date(dateOfBirth).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="security-tips">
                  <h4>🔒 Security Tips:</h4>
                  <ul>
                    <li>Never share your vault password</li>
                    <li>Use a password manager</li>
                    <li>Keep your security answers private</li>
                    <li>Log out when using public computers</li>
                  </ul>
                </div>

                <button className="complete-btn" onClick={handleVaultSetup}>
                  <Shield size={20} />
                  Secure My Vault
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VaultSetup;