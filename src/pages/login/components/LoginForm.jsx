// C:\Projects\WhatsAppBot_Rocket\src\pages\login\components\LoginForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import Icon from "../../../components/AppIcon";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../lib/AuthProvider";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target || {};
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors?.[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.email) {
      newErrors.email = "El email es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(formData?.email)) {
      newErrors.email = "Ingresá un email válido.";
    }

    if (!formData?.password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (formData?.password?.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    const { email, password } = formData;
    const result = await login(email, password);

    setIsLoading(false);

    if (!result.ok) {
      setErrors((prev) => ({
        ...prev,
        general:
          result.error?.message || "Credenciales inválidas. Probá de nuevo.",
      }));
      return;
    }

    // Login OK → dashboard del tenant
    navigate("/tenant-dashboard");
  };

  const handleForgotPassword = async () => {
    setForgotError("");
    setForgotMessage("");

    if (!formData?.email) {
      setForgotError("Ingresá tu email para enviarte el enlace de reinicio.");
      return;
    }

    try {
      setForgotLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) {
        console.error(error);
        setForgotError(
          error.message ||
            "No pudimos enviar el email de reinicio. Intentá nuevamente."
        );
      } else {
        setForgotMessage(
          "Si el email existe, te enviamos un enlace para restablecer la contraseña."
        );
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigate("/tenant-registration");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error general */}
        {errors?.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} className="text-red-600" />
              <p className="text-sm text-red-700">{errors?.general}</p>
            </div>
          </div>
        )}

        {forgotError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {forgotError}
          </div>
        )}

        {forgotMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-700">
            {forgotMessage}
          </div>
        )}

        {/* Email */}
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="Ingresá tu email"
          value={formData?.email}
          onChange={handleInputChange}
          error={errors?.email}
          required
          disabled={isLoading || forgotLoading}
        />

        {/* Password */}
        <Input
          label="Contraseña"
          type="password"
          name="password"
          placeholder="Ingresá tu contraseña"
          value={formData?.password}
          onChange={handleInputChange}
          error={errors?.password}
          required
          disabled={isLoading || forgotLoading}
        />

        {/* Remember me */}
        <Checkbox
          label="Recordarme por 30 días"
          name="rememberMe"
          checked={formData?.rememberMe}
          onChange={handleInputChange}
          disabled={isLoading || forgotLoading}
        />

        {/* Botón login */}
        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading}
          iconName="LogIn"
          iconPosition="right"
        >
          Iniciar sesión
        </Button>

        {/* Links extra */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-center text-sm text-primary hover:text-primary/80 micro-animation"
            disabled={isLoading || forgotLoading}
          >
            {forgotLoading
              ? "Enviando enlace de reinicio…"
              : "¿Olvidaste tu contraseña?"}
          </button>

          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              ¿No tenés cuenta aún?{" "}
            </span>
            <button
              type="button"
              onClick={handleCreateAccount}
              className="text-sm text-primary hover:text-primary/80 font-medium micro-animation"
              disabled={isLoading || forgotLoading}
            >
              Crear cuenta
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
