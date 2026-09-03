import React from "react";

export function Card({
  title,
  subtitle,
  icon,
  iconColor,
  badge,
  headerActions,
  headerStyle = {},
  children,
  className = "",
  style = {},
}) {
  const hasHeader = title || subtitle || icon || headerActions || badge != null;

  return (
    <div className={`card ${className}`} style={style}>
      {hasHeader && (
        <div className="card-header" style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {icon && (
              <span className="material-icons" style={{ color: iconColor, flexShrink: 0 }}>
                {icon}
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              {title && (
                typeof title === "string" ? (
                  <span className="card-title">{title}</span>
                ) : (
                  title
                )
              )}
              {subtitle && (
                <p className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {badge != null && <span className="count-badge">{badge}</span>}
            {headerActions}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export default Card;
