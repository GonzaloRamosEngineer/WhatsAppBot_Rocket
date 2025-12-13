// C:\Projects\WhatsAppBot_Rocket\src\lib\ProtectedRoute.jsx

import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import MatchBotLoader from "../components/ui/MatchBotLoader";

export default function ProtectedRoute({ children, roles }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  // 1. Estado para el "Splash Screen" (Branding)
  // Iniciamos en true para mostrar el logo inmediatamente al cargar la app
  const [showSplash, setShowSplash] = useState(true);

  // 2. Temporizador de Branding
  useEffect(() => {
    // Mantenemos el loader visible por 1.5 segundos (1500ms)
    // Esto da una sensación de estabilidad y marca "Pro".
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  console.log("[ProtectedRoute] render", { session, profile, loading, roles });

  const isAuthLoading = loading && !session;
  const isProfileLoading = !!session && !!roles && !profile;

  // 3. LÓGICA DE CARGA UNIFICADA
  // Mostramos el Loader si:
  // A) Supabase está cargando (isAuthLoading)
  // B) El perfil está cargando (isProfileLoading)
  // C) O el temporizador de branding (showSplash) aún no terminó
  if (isAuthLoading || isProfileLoading || showSplash) {
    return <MatchBotLoader />;
  }

  // 4. Redirecciones (Solo ocurren cuando showSplash es false y la carga terminó)
  
  // Si no hay sesión -> Login
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

  // Si no tiene permisos -> Home
  if (roles && !roles.includes(profile?.role)) {
    console.log("[ProtectedRoute] role not allowed", {
      have: profile?.role,
      needed: roles,
    });
    return <Navigate to="/" replace />;
  }

  return children;
}