import React from "react";
import Routes from "./Routes";
import AuthProvider from "./lib/AuthProvider";

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
