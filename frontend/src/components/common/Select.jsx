import React from "react";

export function Select({ label, value, onChange, options = [], required, disabled, error, className = "", full = false, children, ...props }) {
  return (
    <div className={`form-group ${full ? "full" : ""} ${className}`}>
      {label && <label className="form-label">{label} {required && "*"}</label>}
      <select className="form-select" value={value} onChange={onChange} disabled={disabled} {...props}>
        {children || options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <span style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{error}</span>}
    </div>
  );
}

export default Select;
