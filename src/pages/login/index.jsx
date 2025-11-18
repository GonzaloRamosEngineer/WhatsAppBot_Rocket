// C:\Projects\WhatsAppBot_Rocket\src\pages\login\index.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Icon from "../../components/AppIcon";
import { useAuth } from "../../lib/AuthProvider";

const LoginPage = () => {
  const { login, session, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  // Si ya hay sesión, mandamos al dashboard
  useEffect(() => {
    console.log("[LoginPage] useEffect session", session);
    if (session) {
      navigate("/tenant-dashboard", { replace: true });
    }
  }, [session, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target || {};
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    const { ok, error } = await login(form.email, form.password);

    if (!ok) {
      console.error("[LoginPage] login error", error);
      setError(error?.message || "Could not sign in. Please try again.");
      return;
    }

    // No hace falta navigate acá, el efecto de session se encarga
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mr-3">
            <Icon name="MessageSquare" size={22} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              DigitalMatch – MatchBot
            </h1>
            <p className="text-xs text-muted-foreground">
              Sign in to manage your WhatsApp workspace
            </p>
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-sm text-destructive flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-destructive" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••••"
            value={form.password}
            onChange={handleChange}
            required
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span></span>
            <Link
              to="/auth/reset-password"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="default"
            fullWidth
            loading={loading}
            disabled={loading}
            iconName="LogIn"
            iconPosition="left"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <span>Don&apos;t have an account? </span>
          <Link
            to="/tenant-registration"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Create workspace
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
