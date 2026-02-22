import React, { useState } from 'react';
import { 
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
} from 'firebase/auth';
import { auth } from '../firebase/config';

const Profile = () => {
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);

  // MFA Setup Start Karna
  const startMfaSetup = async () => {
    if (!phoneNumber) {
      alert('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const phoneInfoOptions = {
        phoneNumber: phoneNumber
      };
      
      const multiFactorSession = await multiFactor(auth.currentUser).getSession();
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        multiFactorSession
      );
      
      setVerificationId(verificationId);
      alert('📱 OTP sent to your phone!');
      
    } catch (error) {
      console.error('MFA setup error:', error);
      alert('Failed to send OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // OTP Verify Karna
  const verifyMfaOtp = async () => {
    if (!verificationCode) {
      alert('Please enter OTP');
      return;
    }

    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      
      await multiFactor(auth.currentUser).enroll(multiFactorAssertion, 'Primary Phone');
      
      alert('✅ MFA enabled successfully!');
      setShowMfaSetup(false);
      
    } catch (error) {
      console.error('MFA verification error:', error);
      alert('OTP verification failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <h2>🔒 Security Settings</h2>
      
      <div className="security-section">
        <h3>Multi-Factor Authentication</h3>
        <p>Add an extra layer of security to your account</p>
        
        {!showMfaSetup ? (
          <button 
            className="enable-mfa-btn"
            onClick={() => setShowMfaSetup(true)}
          >
            📱 Enable SMS MFA
          </button>
        ) : (
          <div className="mfa-setup">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 9876543210"
                disabled={verificationId}
              />
            </div>
            
            {!verificationId ? (
              <button 
                onClick={startMfaSetup}
                disabled={loading}
                className="auth-button primary"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            ) : (
              <>
                <div className="form-group">
                  <label>Enter OTP</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                
                <button 
                  onClick={verifyMfaOtp}
                  disabled={loading}
                  className="auth-button primary"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </>
            )}
            
            <button 
              onClick={() => setShowMfaSetup(false)}
              className="auth-button secondary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;