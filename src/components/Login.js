import React, { useState, useEffect } from "react";
import "../styles/Auth.css";
import { supabase } from "../supabase/config";

const Login = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ====== CHECK USER SESSION ON MOUNT ======
  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      if (data.session) {
        setUser(data.session.user);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ====== GOOGLE LOGIN ======
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) throw error;
    } catch (err) {
      console.error("Google login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ====== LOGOUT ======
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      alert("👋 Logged out successfully!");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {!user ? (
          <>
            <div className="auth-header">
              <div className="auth-icon">🛡️</div>
              <h1>Login</h1>
              <p>Access your secure CyberSecure Vault</p>
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            <button
              className="auth-button primary"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div> Connecting...
                </>
              ) : (
                "🔓 Login with Google"
              )}
            </button>

            <div className="security-note">
              <p>🔒 Secured via Supabase Authentication</p>
            </div>
          </>
        ) : (
          <>
            <div className="auth-header">
              <img
                src={user.user_metadata?.avatar_url || "https://i.imgur.com/3ZQ3ZyL.png"}
                alt="Profile"
                className="profile-pic"
              />
              <h2>{user.user_metadata?.full_name || "User"}</h2>
              <p>{user.email}</p>
            </div>

            <button className="auth-button danger" onClick={handleLogout}>
              🚪 Logout
            </button>

            <div className="security-note">
              <p>🛡️ You are securely logged in with Supabase</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
