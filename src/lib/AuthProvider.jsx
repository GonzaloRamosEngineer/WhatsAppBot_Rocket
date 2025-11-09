import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // { role, tenant_id }
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    if (email === "tenant@business.com" && password === "tenant123") {
      setSession({ user: { id: "tenant-1", email } });
      setProfile({ role: "tenant", tenant_id: "t-digitalmatch" });
      return true;
    }
    if (email === "admin@whatsappbot.com" && password === "admin123") {
      setSession({ user: { id: "admin-1", email } });
      setProfile({ role: "admin", tenant_id: null });
      return true;
    }
    alert("Credenciales inválidas (usa admin@whatsappbot.com / tenant@business.com)");
    return false;
  };

  const logout = () => {
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
