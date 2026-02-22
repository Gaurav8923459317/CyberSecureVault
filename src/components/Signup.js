// src/components/Signup.jsx
import React, { useState } from "react";
import { supabase } from "../supabase/config";
import "../styles/Auth.css";

const Signup = ({ onSignupSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) throw error;

      alert("Redirecting to Google for authentication...");
    } catch (err) {
      console.error("❌ Signup error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Sign Up with Google</h1>
        {error && <div className="error-message">⚠️ {error}</div>}
        <button
          className="auth-button primary"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          {loading ? "Connecting..." : "🔐 Sign up with Google"}
        </button>
      </div>
    </div>
  );
};

export default Signup;
