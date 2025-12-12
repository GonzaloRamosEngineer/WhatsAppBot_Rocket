// C:\Projects\WhatsAppBot_Rocket\src\Routes.jsx

import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";

import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";

import NotFound from "pages/NotFound";
import FlowBuilder from "./pages/flow-builder";
import TenantRegistration from "./pages/tenant-registration";
import LoginPage from "./pages/login";
import ChannelSetup from "./pages/channel-setup";
import MessagesLog from "./pages/messages-log";
import TenantDashboard from "./pages/tenant-dashboard";
import AgentInboxPage from "./pages/agent-inbox";

// 👇 1. IMPORTAMOS LA NUEVA PÁGINA
import TemplateBlueprintsPage from "./pages/template-blueprints";

import ProtectedRoute from "./lib/ProtectedRoute";
import PasswordResetPage from "./pages/password-reset";
import FacebookCallback from "./pages/oauth/FacebookCallback";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* ... rutas públicas (login, etc) igual que antes ... */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/reset-password" element={<PasswordResetPage />} />
          <Route path="/tenant-registration" element={<TenantRegistration />} />
          <Route path="/oauth/facebook/callback" element={<FacebookCallback />} />

          {/* Protected routes */}
          <Route
            path="/tenant-dashboard"
            element={
              <ProtectedRoute>
                <TenantDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/flow-builder"
            element={
              <ProtectedRoute>
                <FlowBuilder />
              </ProtectedRoute>
            }
          />

          {/* 👇 2. AGREGAMOS LA NUEVA RUTA AQUÍ */}
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <TemplateBlueprintsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/channel-setup"
            element={
              <ProtectedRoute>
                <ChannelSetup />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages-log"
            element={
              <ProtectedRoute>
                <MessagesLog />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent-inbox"
            element={
              <ProtectedRoute>
                <AgentInboxPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;