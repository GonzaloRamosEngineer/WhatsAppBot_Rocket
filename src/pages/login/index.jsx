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

  // Si ya hay sesión → mandamos directo al dashboard
  useEffect(() => {
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
      setError("Ingresá tu email y contraseña.");
      return;
    }

    const { ok, error } = await login(form.email, form.password);

    if (!ok) {
      console.error("[LoginPage] login error", error);
      setError(
        error?.message ||
          "No pudimos iniciar sesión. Verificá los datos e intentá nuevamente."
      );
      return;
    }
    // El redirect lo maneja el useEffect cuando cambia session
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
              Iniciá sesión para administrar tu workspace de WhatsApp.
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="tu@empresa.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Contraseña"
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
              ¿Olvidaste tu contraseña?
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
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <span>¿Todavía no tenés cuenta? </span>
          <Link
            to="/tenant-registration"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Crear workspace
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
