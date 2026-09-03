import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/authApi";
import "../../styles/Auth.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailNotFound, setEmailNotFound] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email address is required.");
      setEmailNotFound(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setEmailNotFound(false);
      return;
    }

    setLoading(true);
    setError("");
    setEmailNotFound(false);

    try {
      await authApi.forgotPassword({ email });
      setStep(2);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data;

      if (status === 404) {
        setEmailNotFound(true);
        setError("This email is not registered. Please check and try again.");
      } else if (status === 400) {
        setEmailNotFound(false);
        setError("Your account is not yet activated. Please verify your registration OTP first.");
      } else {
        setEmailNotFound(false);
        setError(typeof msg === "string" && msg ? msg : "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("OTP is required.");
      return;
    }
    if (otp.length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authApi.verifyResetOtp({ email, otp });
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data;
      setError(typeof msg === "string" && msg ? msg : "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase (capital) letter.");
      return;
    }
    if (!/\d/.test(newPassword)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError("Password must contain at least one special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authApi.resetPassword({
        email,
        otp,
        newPassword,
      });
      setSuccess("Password reset successfully! Redirecting to login…");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data;
      setError(typeof msg === "string" && msg ? msg : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo-icon">
            <span className="material-icons">shield</span>
          </div>
          <span className="auth-brand-name">InsureCo</span>
        </div>
        <div className="auth-hero">
          <h1 className="auth-headline">
            Reset your<br />password
          </h1>
          <p className="auth-sub">
            Follow the steps to recover access to your InsureCo account safely.
          </p>
        </div>
        <div className="auth-steps">
          <div className={`auth-step ${step >= 1 ? "active" : ""}`}>
            <div className="auth-step-dot">{step > 1 ? "✓" : "1"}</div>
            <span>Enter Email</span>
          </div>
          <div className="auth-step-line" />
          <div className={`auth-step ${step >= 2 ? "active" : ""}`}>
            <div className="auth-step-dot">{step > 2 ? "✓" : "2"}</div>
            <span>Verify OTP</span>
          </div>
          <div className="auth-step-line" />
          <div className={`auth-step ${step >= 3 ? "active" : ""}`}>
            <div className="auth-step-dot">3</div>
            <span>New Password</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {step === 1 && (
            <>
              <div className="auth-card-header">
                <h2 className="auth-card-title">Forgot password?</h2>
                <p className="auth-card-sub">Enter your email and we'll send you an OTP code</p>
              </div>
              {error && (
                <div className="auth-error">
                  <span className="material-icons">error_outline</span>
                  {error}
                </div>
              )}
              <form onSubmit={handleSendOtp} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Registered Email</label>
                  <div className="auth-input-wrap">
                    <span className="material-icons auth-input-icon">email</span>
                    <input
                      id="forgot-email"
                      type="email"
                      className={`auth-input ${emailNotFound ? "input-error" : ""}`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                        setEmailNotFound(false);
                      }}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <button id="send-otp-btn" type="submit" className="auth-submit" disabled={loading}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="auth-spinner" /> Sending OTP…
                    </span>
                  ) : (
                    "Send OTP Code"
                  )}
                </button>
              </form>
              <p className="auth-footer-link">
                Remembered your password? <Link to="/login" className="auth-link">Sign in</Link>
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="auth-card-header">
                <h2 className="auth-card-title">Enter OTP Code</h2>
                <p className="auth-card-sub">Check your inbox at <strong>{email}</strong></p>
              </div>
              {error && (
                <div className="auth-error">
                  <span className="material-icons">error_outline</span>
                  {error}
                </div>
              )}
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">6-Digit OTP</label>
                  <div className="auth-input-wrap">
                    <span className="material-icons auth-input-icon">pin</span>
                    <input
                      id="reset-otp-input"
                      className="auth-input"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        setError("");
                      }}
                      maxLength={6}
                    />
                  </div>
                </div>
                <button id="verify-reset-otp-btn" type="submit" className="auth-submit" disabled={loading}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="auth-spinner" /> Verifying…
                    </span>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
                <button
                  type="button"
                  className="auth-back"
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                >
                  ← Back to Email
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div className="auth-card-header">
                <h2 className="auth-card-title">Set New Password</h2>
                <p className="auth-card-sub">Create a strong password for your account</p>
              </div>

              {error && (
                <div className="auth-error">
                  <span className="material-icons">error_outline</span>
                  {error}
                </div>
              )}

              {success && (
                <div className="auth-success" style={{ padding: "10px 14px", background: "#dcfce7", color: "#166534", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span className="material-icons">check_circle</span>
                  {success}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">New Password *</label>
                  <div className="auth-input-wrap">
                    <span className="material-icons auth-input-icon">lock</span>
                    <input
                      id="new-password"
                      type={showPwd ? "text" : "password"}
                      className="auth-input"
                      placeholder="Min 8 chars, A-Z, 0-9, special"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError("");
                      }}
                    />
                    <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd((s) => !s)} tabIndex={-1}>
                      <span className="material-icons">{showPwd ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Confirm New Password *</label>
                  <div className="auth-input-wrap">
                    <span className="material-icons auth-input-icon">lock</span>
                    <input
                      id="confirm-new-password"
                      type={showConfirmPwd ? "text" : "password"}
                      className="auth-input"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                    />
                    <button type="button" className="auth-pwd-toggle" onClick={() => setShowConfirmPwd((s) => !s)} tabIndex={-1}>
                      <span className="material-icons">{showConfirmPwd ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>

                <button id="reset-pwd-btn" type="submit" className="auth-submit" disabled={loading}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="auth-spinner" /> Resetting…
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
