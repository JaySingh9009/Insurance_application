import React from "react";
import Sidebar from "./Sidebar";
import "../../styles/shared.css";

export function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">{children}</div>
    </div>
  );
}

export default AppLayout;
