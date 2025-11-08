import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import FlowBuilder from './pages/flow-builder';
import TenantRegistration from './pages/tenant-registration';
import LoginPage from './pages/login';
import ChannelSetup from './pages/channel-setup';
import MessagesLog from './pages/messages-log';
import TenantDashboard from './pages/tenant-dashboard';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/flow-builder" element={<FlowBuilder />} />
        <Route path="/tenant-registration" element={<TenantRegistration />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/channel-setup" element={<ChannelSetup />} />
        <Route path="/messages-log" element={<MessagesLog />} />
        <Route path="/tenant-dashboard" element={<TenantDashboard />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
