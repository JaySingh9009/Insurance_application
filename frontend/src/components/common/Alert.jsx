import React from "react";

export function Alert({ type = "error", message, children, style = {}, className = "", icon }) {
  if (!message && !children) return null;
  const defaultIcon = type === "success" ? "check_circle" : type === "warning" ? "warning" : type === "info" ? "info" : "error";
  const displayIcon = icon || defaultIcon;
  return (
    <div className={`alert alert-${type} ${className}`} style={style}>
      <span className="material-icons">{displayIcon}</span>
      <span>{message || children}</span>
    </div>
  );
}

export default Alert;
