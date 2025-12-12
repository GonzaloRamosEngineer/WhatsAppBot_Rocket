// C:\Projects\WhatsAppBot_Rocket\src\Routes.jsx

import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";

import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";

// Componentes de Layout y Auth
import ProtectedRoute from "./lib/ProtectedRoute";
import TenantLayout from "./components/layouts/TenantLayout";

// Páginas Públicas
import LoginPage from "./pages/login";
import TenantRegistration from "./pages/tenant-registration";
import PasswordResetPage from "./pages/password-reset";
import FacebookCallback from "./pages/oauth/FacebookCallback";
import NotFound from "pages/NotFound";

// Páginas del Sistema (Protegidas)
import TenantDashboard from "./pages/tenant-dashboard";
import ChannelSetup from "./pages/channel-setup";
import FlowBuilder from "./pages/flow-builder";
import TemplateBlueprintsPage from "./pages/template-blueprints";
import MessagesLog from "./pages/messages-log";
import AgentInboxPage from "./pages/agent-inbox";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          
          {/* --- RUTAS PÚBLICAS --- */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tenant-registration" element={<TenantRegistration />} />
          <Route path="/auth/reset-password" element={<PasswordResetPage />} />
          <Route path="/oauth/facebook/callback" element={<FacebookCallback />} />

          {/* --- RUTAS PROTEGIDAS (LAYOUT MAESTRO) --- */}
          {/* 1. ProtectedRoute verifica autenticación.
             2. TenantLayout renderiza el Sidebar y el contenedor principal.
             3. Las rutas anidadas se renderizan dentro del Outlet del Layout.
          */}
          <Route
            element={
              <ProtectedRoute>
                <TenantLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/tenant-dashboard" element={<TenantDashboard />} />
            
            {/* Configuración */}
            <Route path="/channel-setup" element={<ChannelSetup />} />
            
            {/* Automatización */}
            <Route path="/templates" element={<TemplateBlueprintsPage />} />
            <Route path="/flow-builder" element={<FlowBuilder />} />
            
            {/* Mensajería */}
            <Route path="/messages-log" element={<MessagesLog />} />
            <Route path="/agent-inbox" element={<AgentInboxPage />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
          
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;