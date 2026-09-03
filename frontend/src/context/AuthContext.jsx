import { createContext, useState } from "react";
import { authApi } from "../api/authApi";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    let role = localStorage.getItem("role");
    if (role === "AGENT") role = "OFFICER";
    const fullName = localStorage.getItem("fullName") || localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const mobileNumber = localStorage.getItem("mobileNumber");
    return token ? { token, role, name: fullName, fullName, email, mobileNumber } : null;
  });

  // Expose isAuthenticated so components don't need to inspect user directly
  const isAuthenticated = !!user;

  const login = (token, rawRole, fullName, email, mobileNumber) => {
    const role = rawRole === "AGENT" ? "OFFICER" : rawRole;
    const displayName = fullName || (email ? email.split("@")[0] : "User");
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("name", displayName);
    if (fullName) localStorage.setItem("fullName", fullName);
    if (email) localStorage.setItem("email", email);
    if (mobileNumber) localStorage.setItem("mobileNumber", mobileNumber);
    setUser({ token, role, name: displayName, fullName, email, mobileNumber });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn("Backend logout notification failed:", e);
    }
    const theme = localStorage.getItem("theme");
    localStorage.clear();
    if (theme) {
      localStorage.setItem("theme", theme);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading: false, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export default AuthContext;
