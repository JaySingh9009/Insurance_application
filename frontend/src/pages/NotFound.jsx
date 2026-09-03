import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGoHome = () => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role === "ADMIN") {
      navigate("/admin");
    } else if (user?.role === "OFFICER") {
      navigate("/officer");
    } else {
      navigate("/customer");
    }
  };

  return (
    <div className="notfound-container">
      {/* Animated background shapes */}
      <div className="notfound-bg-shape notfound-bg-shape-1"></div>
      <div className="notfound-bg-shape notfound-bg-shape-2"></div>
      <div className="notfound-bg-shape notfound-bg-shape-3"></div>

      <div className="notfound-content">
        {/* Brand */}
        <div className="notfound-brand">
          <div className="notfound-logo-icon">
            <span className="material-icons">shield</span>
          </div>
          <span className="notfound-brand-name">SecureLife Insurance</span>
        </div>

        {/* 404 Number */}
        <div className="notfound-code">
          <span className="notfound-digit">4</span>
          <div className="notfound-icon-circle">
            <span className="material-icons">search_off</span>
          </div>
          <span className="notfound-digit">4</span>
        </div>

        {/* Message */}
        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-desc">
          The page you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable.
        </p>

        {/* Action buttons */}
        <div className="notfound-actions">
          <button className="notfound-btn-primary" onClick={handleGoHome}>
            <span className="material-icons">home</span>
            Go to Dashboard
          </button>
          <button className="notfound-btn-secondary" onClick={() => navigate(-1)}>
            <span className="material-icons">arrow_back</span>
            Go Back
          </button>
        </div>

        {/* Help text */}
        <p className="notfound-help">
          Need help? Contact our <a href="mailto:support@securelife.com" className="notfound-link">support team</a>
        </p>
      </div>
    </div>
  );
}
