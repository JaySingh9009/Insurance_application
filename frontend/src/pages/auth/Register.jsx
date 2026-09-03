import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/authApi";
import "../../styles/Auth.css";

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
    verificationChannel: "email",
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const f = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password || !form.confirmPassword || !form.mobileNumber) {
      setError("All fields are required.");
      return;
    }
    if (/\d/.test(form.fullName)) {
      setError("Full Name must not contain numbers.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(form.mobileNumber)) {
      setError("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/\d/.test(form.password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      setError("Password must contain at least one special character.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const registerPayload = { ...form };
      delete registerPayload.confirmPassword;
      await authApi.register(registerPayload);
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data;
      setError(typeof msg === "string" && msg ? msg : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Enter your OTP.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authApi.verifyOtp({
        email: form.email,
        otp,
        channel: form.verificationChannel,
      });
      navigate("/login", { state: { registered: true } });

    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data;
      setError(typeof msg === "string" && msg ? msg : "Invalid OTP. Please try again.");
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
            Your safety,<br />our priority
          </h1>
          <p className="auth-sub">
            Join thousands of customers who trust InsureCo to protect their future.
          </p>
        </div>
        <div className="auth-steps">
          <div className={`auth-step ${step >= 1 ? "active" : ""}`}>
            <div className="auth-step-dot">{step > 1 ? "✓" : "1"}</div>
            <span>Create Account</span>
          </div>
          <div className="auth-step-line" />
          <div className={`auth-step ${step >= 2 ? "active" : ""}`}>
            <div className="auth-step-dot">2</div>
            <span>Verify OTP</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {step === 1 ? (
            <>
              <div className="auth-card-header">
                <h2 className="auth-card-title">Create account</h2>
                <p className="auth-card-sub">Sign up for InsureCo</p>
              </div>
              {error && (
                <div className="auth-error">
                  <span className="material-icons">error_outline</span>
                  {error}
                </div>
              )}
              <form onSubmit={handleRegister} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Full Name *</label>
                  <div className="auth-input-wrap">
                    <span className="material-icons auth-input-icon">person</span>
                    <input
                      id="reg-name"
                      className="auth-input"
                      placeholder="John Doe"
                      value={form.fullName}
                      onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value.replace(/\d/g, "") }))}
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Email *</label>
                  <div className="auth-input-wrap">
                    <span className="material-icons auth-input-icon">email</span>
                    <input
                      id="reg-email"
                      type="email"
                      className="auth-input"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={f("email")}
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Mobile Number * (10 digits starting 6–9)</label>
                  <div className="auth-input-wrap">
                    <span className="material-icons auth-input-icon">phone</span>
                    <input
                      id="reg-mobile"
                      className="auth-input"
                      placeholder="9876543210"
                      value={form.mobileNumber}
                      onChange={f("mobileNumber")}
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Password * (min 8 chars, uppercase, number, special)</label>
                  <div className="auth-input-wrap">
                    <span className="material-icons auth-input-icon">lock</span>
                    <input
                      id="reg-password"
                      type={showPwd ? "text" : "password"}
                      className="auth-input"
                      placeholder="Strong password"
                      value={form.password}
                      onChange={f("password")}
                    />
                    <button
                      type="button"
                      className="auth-pwd-toggle"
                      onClick={() => setShowPwd((s) => !s)}
                      tabIndex={-1}
                    >
                      <span className="material-icons">{showPwd ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Confirm Password *</label>
                  <div className="auth-input-wrap">
                    <span className="material-icons auth-input-icon">lock</span>
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPwd ? "text" : "password"}
                      className="auth-input"
                      placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={f("confirmPassword")}
                    />
                    <button
                      type="button"
                      className="auth-pwd-toggle"
                      onClick={() => setShowConfirmPwd((s) => !s)}
                      tabIndex={-1}
                    >
                      <span className="material-icons">{showConfirmPwd ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">OTP Channel *</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["email", "phone"].map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        className={form.verificationChannel === ch ? "btn-primary" : "btn-ghost"}
                        style={{ flex: 1, justifyContent: "center" }}
                        onClick={() => setForm((f) => ({ ...f, verificationChannel: ch }))}
                      >
                        <span className="material-icons">{ch === "email" ? "email" : "phone"}</span>
                        {ch.charAt(0).toUpperCase() + ch.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <button id="register-btn" type="submit" className="auth-submit" disabled={loading}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="auth-spinner" />Creating account…
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
              <p className="auth-footer-link">
                Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <div className="auth-card-header">
                <h2 className="auth-card-title">Verify your account</h2>
                <p className="auth-card-sub">Enter the OTP sent to your {form.verificationChannel}</p>
              </div>
              {error && (
                <div className="auth-error">
                  <span className="material-icons">error_outline</span>
                  {error}
                </div>
              )}
              <div className="auth-otp-hint">
                OTP sent to <strong>{form.verificationChannel === "email" ? form.email : form.mobileNumber}</strong>
              </div>
              <form onSubmit={handleVerify} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">OTP Code *</label>
                  <div className="auth-input-wrap">
                    <span className="material-icons auth-input-icon">pin</span>
                    <input
                      id="otp-input"
                      className="auth-input"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                </div>
                <button id="verify-btn" type="submit" className="auth-submit" disabled={loading}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="auth-spinner" />Verifying…
                    </span>
                  ) : (
                    "Verify & Activate"
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
                  ← Edit Details
                </button>
                
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;
