import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { useAuth } from "../../hooks/useAuth";
import SupportWidget from "../../components/common/SupportWidget";
import "../../styles/Auth.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginUser = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await authApi.login({ email, password });
      const data = response.data;
      login(data.token, data.role, data.fullName, data.email, data.mobileNumber);


      if (data.role === "ADMIN") navigate("/admin");
      else if (data.role === "CUSTOMER") navigate("/customer");
      else if (data.role === "AGENT" || data.role === "OFFICER") navigate("/officer");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "";
      setError(typeof msg === "string" && msg ? msg : "Invalid email or password.");
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
            Protect what<br />matters most
          </h1>
          <p className="auth-sub">
            Manage policies, track claims, and handle payments — all from one powerful portal.
          </p>
        </div>
        <div className="auth-features">
          {[
            { icon: "policy", text: "Manage all your policies" },
            { icon: "assignment", text: "Real-time claim tracking" },
            { icon: "payments", text: "Seamless premium payments" },
          ].map((f) => (
            <div className="auth-feature-item" key={f.text}>
              <span className="material-icons">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">Welcome back</h2>
            <p className="auth-card-sub">Sign in to your account</p>
          </div>

          {error && (
            <div className="auth-error">
              <span className="material-icons">error_outline</span>
              {error}
            </div>
          )}

          <form onSubmit={loginUser} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <span className="material-icons auth-input-icon">email</span>
                <input
                  id="login-email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="auth-label">Password</label>
                <Link to="/forgot-password" className="auth-link" style={{ fontSize: "12.5px" }}>
                  Forgot password?
                </Link>
              </div>
              <div className="auth-input-wrap">
                <span className="material-icons auth-input-icon">lock</span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="auth-pwd-toggle" onClick={() => setShowPassword((s) => !s)} tabIndex={-1}>
                  <span className="material-icons">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <button id="login-btn" type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="auth-spinner" /> Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="auth-footer-link">
            Don't have an account? <Link to="/register" className="auth-link">Create one</Link>
          </p>

          <SupportWidget email="admin.support@insureco.com" />
        </div>
      </div>
    </div>
  );
}

export default Login;
