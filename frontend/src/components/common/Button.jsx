import React from "react";

export function Button({
  children,
  variant = "primary",
  icon,
  iconStyle = {},
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  style = {},
  className = "",
  ...props
}) {
  const variantClass = variant ? `btn-${variant}` : "";
  const cls = `${variantClass} ${className}`.trim();
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled || loading} style={style} {...props}>
      {loading ? (
        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
      ) : typeof icon === "string" ? (
        <span className="material-icons" style={iconStyle}>{icon}</span>
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}

export default Button;
