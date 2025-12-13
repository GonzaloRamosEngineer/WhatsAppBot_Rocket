// C:\Projects\WhatsAppBot_Rocket\src\lib\ProtectedRoute.jsx

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
// 👇 Importamos tu nuevo componente visual
import MatchBotLoader from "../components/ui/MatchBotLoader";

export default function ProtectedRoute({ children, roles }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  console.log("[ProtectedRoute] render", { session, profile, loading, roles });

  const isAuthLoading = loading && !session;
  const isProfileLoading = !!session && !!roles && !profile;

  // 1) ESTADO DE CARGA
  // Aquí es donde ocurre la magia visual. La lógica de CUÁNDO mostrarlo es la misma,
  // pero el QUÉ mostramos es tu nuevo loader Pro.
  if (isAuthLoading || isProfileLoading) {
    return <MatchBotLoader />;
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