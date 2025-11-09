import React from "react";
import Routes from "./Routes";
import AuthProvider from "./lib/AuthProvider";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Routes />
      </ErrorBoundary>
    </AuthProvider>
  );
}
