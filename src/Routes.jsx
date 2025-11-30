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

import ProtectedRoute from "./lib/ProtectedRoute";
import PasswordResetPage from "./pages/password-reset";

// 👇 NUEVO: callback de Facebook OAuth
import FacebookCallback from "./pages/oauth/FacebookCallback";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Login (default) */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Password reset (Supabase redirectTo) */}
          <Route path="/auth/reset-password" element={<PasswordResetPage />} />

          {/* Public routes */}
          <Route
            path="/tenant-registration"
            element={<TenantRegistration />}
          />

          {/* ⚠️ Callback de Facebook – NO debe ir dentro de ProtectedRoute */}
          <Route
            path="/oauth/facebook/callback"
            element={<FacebookCallback />}
          />

          {/* Protected routes (requieren usuario autenticado) */}
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

          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
