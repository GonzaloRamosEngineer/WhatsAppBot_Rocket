// C:\Projects\WhatsAppBot_Rocket\src\lib\ProtectedRoute.jsx

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children, roles }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  console.log("[ProtectedRoute] render", { session, profile, loading, roles });

  const isAuthLoading = loading && !session;
  const isProfileLoading = !!session && !!roles && !profile;

  // 1) Todavía no sabemos si hay sesión, o estamos cargando perfil con roles
  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <span>
            {isAuthLoading
              ? "Cargando sesión..."
              : "Cargando datos del espacio de trabajo..."}
          </span>
        </div>
      </div>
    );
  }

  // 2) Ya sabemos que NO hay sesión → ir a login
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

  // 3) Hay sesión y ya conocemos el perfil → validamos roles (si aplica)
  if (roles && !roles.includes(profile?.role)) {
    console.log("[ProtectedRoute] role not allowed", {
      have: profile?.role,
      needed: roles,
    });
    return <Navigate to="/" replace />;
  }

  return children;
}
