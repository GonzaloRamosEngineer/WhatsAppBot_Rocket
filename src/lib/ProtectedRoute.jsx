// C:\Projects\WhatsAppBot_Rocket\src\lib\ProtectedRoute.jsx

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children, roles }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  console.log("[ProtectedRoute] render", { session, profile, loading, roles });

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <span>Cargando sesión...</span>
        </div>
      </div>
    );
  }

  // Sin sesión → a login
  if (!session) {
    console.log("[ProtectedRoute] no session → /login");
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Si se especifican roles y el usuario no los tiene → redirigir
  if (roles && !roles.includes(profile?.role)) {
    console.log("[ProtectedRoute] role not allowed", {
      have: profile?.role,
      needed: roles,
    });
    return <Navigate to="/" replace />;
  }

  return children;
}
