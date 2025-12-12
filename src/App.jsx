// C:\Projects\WhatsAppBot_Rocket\src\App.jsx

import React from "react";
import Routes from "./Routes";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes />
    </ErrorBoundary>
  );
}


