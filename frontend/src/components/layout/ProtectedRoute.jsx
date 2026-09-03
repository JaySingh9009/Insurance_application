import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const { user, isAuthenticated, loading, login } = useAuth();

  // Dev preview shortcut: ?preview=ROLE lets you jump in without logging in
  if (params.get("preview") && allowedRoles) {
    const previewRole = params.get("preview");
    if (allowedRoles.includes(previewRole)) {
      const localToken = localStorage.getItem("token");
      if (!localToken) {
        login("dev-preview-token", previewRole, `${previewRole.charAt(0) + previewRole.slice(1).toLowerCase()} Preview`);
      }
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles specified, enforce role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback =
      user.role === "ADMIN" ? "/admin" :
      (user.role === "AGENT" || user.role === "OFFICER") ? "/officer" :
      "/customer";
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export default ProtectedRoute;
