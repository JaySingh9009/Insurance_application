import { useState } from "react";

export default function SupportWidget({ email = "admin.support@insureco.com" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginTop: 20,
        padding: "12px 14px",
        borderRadius: 10,
        background: "rgba(99, 102, 241, 0.08)",
        border: "1px solid rgba(99, 102, 241, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.18)",
            color: "#818cf8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span className="material-icons" style={{ fontSize: 18 }}>
            support_agent
          </span>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Need Support / Account Help?
          </div>
          <a
            href={`mailto:${email}`}
            style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", textDecoration: "none" }}
          >
            {email}
          </a>
        </div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          background: "none",
          border: "none",
          color: copied ? "#10b981" : "#9ca3af",
          cursor: "pointer",
          padding: 4,
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          fontWeight: 500,
        }}
        title="Copy Email"
      >
        <span className="material-icons" style={{ fontSize: 16 }}>
          {copied ? "check" : "content_copy"}
        </span>
        {copied && <span>Copied</span>}
      </button>
    </div>
  );
}
