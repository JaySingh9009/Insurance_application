import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/Sidebar.css";

const ADMIN_NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: "grid_view", end: true }],
  },
  {
    label: "Management",
    items: [
      { to: "/admin/policies", label: "Policies", icon: "policy" },
      { to: "/admin/claims", label: "Claims", icon: "assignment" },
      { to: "/admin/customers", label: "Customers", icon: "people" },
      { to: "/admin/payments", label: "Payments", icon: "payments" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/admin/products", label: "Products", icon: "inventory_2" },
      { to: "/admin/plans", label: "Policy Plans", icon: "fact_check" },
    ],
  },
  {
    label: "Admin",
    items: [{ to: "/admin/users", label: "Users & Officers", icon: "manage_accounts" }],
  },
];

const AGENT_NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ to: "/officer", label: "Dashboard", icon: "grid_view", end: true }],
  },
  {
    label: "Work",
    items: [
      { to: "/officer/claims", label: "Claims", icon: "assignment" },
      { to: "/officer/policies", label: "Policies", icon: "policy" },
      { to: "/officer/customers", label: "Customers", icon: "people" },
      { to: "/officer/payments", label: "Payments", icon: "payments" },
    ],
  },
  {
    label: "Account",
    items: [{ to: "/officer/profile", label: "My Profile", icon: "person" }],
  },
];

const CUSTOMER_NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ to: "/customer", label: "Dashboard", icon: "grid_view", end: true }],
  },
  {
    label: "My Insurance",
    items: [
      { to: "/customer/policies", label: "My Policies", icon: "policy" },
      { to: "/customer/claims", label: "My Claims", icon: "assignment" },
      { to: "/customer/payments", label: "Payments", icon: "payments" },
      { to: "/customer/plans", label: "Browse Plans", icon: "explore" },
    ],
  },
  {
    label: "Account",
    items: [{ to: "/customer/profile", label: "My Profile", icon: "person" }],
  },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const role = user?.role || "ADMIN";

  const groups =
    (role === "AGENT" || role === "OFFICER")
      ? AGENT_NAV_GROUPS
      : role === "CUSTOMER"
      ? CUSTOMER_NAV_GROUPS
      : ADMIN_NAV_GROUPS;

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || document.body.classList.contains("dark");
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const logout = () => {
    authLogout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <span className="material-icons">shield</span>
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-app-name">InsureCo</span>
          <span className="sidebar-app-sub">Policy &amp; Claims Portal</span>
        </div>
      </div>

      <div className={`sidebar-role-badge role-${role.toLowerCase()}`}>
        {(role === "AGENT" || role === "OFFICER") ? "Insurance Officer" : role.charAt(0) + role.slice(1).toLowerCase()}
      </div>

      <nav className="sidebar-nav">
        {groups.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <span className="sidebar-group-label">{group.label}</span>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
              >
                <span className="material-icons sidebar-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <button className="sidebar-theme-toggle" onClick={toggleTheme}>
        <span className="material-icons">{isDark ? "light_mode" : "dark_mode"}</span>
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
      </button>

      <button className="sidebar-signout" onClick={logout}>
        <span className="material-icons">logout</span>
        <span>Sign out</span>
      </button>
    </aside>
  );
}

export default Sidebar;
