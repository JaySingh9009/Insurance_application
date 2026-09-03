import React from "react";

export function EmptyState({ icon = "inbox", message = "No records found" }) {
  return (
    <div className="empty-state">
      <span className="material-icons">{icon}</span>
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;
