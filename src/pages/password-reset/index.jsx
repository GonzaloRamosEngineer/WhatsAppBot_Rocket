import React from "react";
import ResetPasswordForm from "./components/ResetPasswordForm";

const PasswordResetPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Reset your password
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter a new password for your WhatsApp Bot Manager account.
            </p>
          </div>

          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
