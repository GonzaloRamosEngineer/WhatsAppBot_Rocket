// src/lib/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children, roles }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  console.log("[ProtectedRoute] render", { session, profile, loading, roles });

  // 1) Estado inicial: todavía no sabemos si hay sesión o no
  //    → mostramos "Cargando sesión..."
  if (loading && !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <span>Cargando sesión...</span>
        </div>
      </div>
    );
  }

  // 2) Ya sabemos que NO hay sesión
  //    (loading puede ser true o false, pero no tenemos session)
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

  // 3) Sí hay sesión.
  //    Aunque loading siga true (porque se está cargando el profile / tenants),
  //    dejamos pasar a la ruta protegida.
  if (roles && !roles.includes(profile?.role)) {
    console.log("[ProtectedRoute] role not allowed", {
      have: profile?.role,
      needed: roles,
    });
    return <Navigate to="/" replace />;
  }

  return children;
}
