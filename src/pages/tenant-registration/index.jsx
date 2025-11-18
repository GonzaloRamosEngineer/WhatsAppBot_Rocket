// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-registration\index.jsx

import React from "react";
import { Helmet } from "react-helmet";
import TenantRegistrationForm from "./components/TenantRegistrationForm";
import FeatureHighlights from "./components/FeatureHighlights";

const TenantRegistrationPage = () => {
  return (
    <>
      <Helmet>
        <title>Create Account - WhatsApp Bot Manager</title>
        <meta
          name="description"
          content="Create your WhatsApp Bot Manager account to connect your WhatsApp number and start managing customer conversations."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-5xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            {/* Columna izquierda: formulario de alta */}
            <div className="bg-card border border-border rounded-xl shadow-lg p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground">
                  Create your account
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Set up your workspace to start managing WhatsApp conversations
                  for your business or organization.
                </p>
              </div>

              <TenantRegistrationForm />

              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="text-xs text-primary hover:text-primary/80 font-medium micro-animation"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </div>

            {/* Columna derecha: highlights comerciales */}
            <div className="hidden lg:block">
              <FeatureHighlights />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TenantRegistrationPage;
