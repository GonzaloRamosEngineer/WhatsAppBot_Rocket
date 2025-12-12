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

  // --- ESTADOS Y LÓGICA (100% ORIGINAL) ---
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
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData?.email)) {
      newErrors.email = "Please enter a valid email.";
    }
    if (!formData?.password) {
      newErrors.password = "Password is required.";
    } else if (formData?.password?.length < 6) {
      newErrors.password = "Password must be at least 6 chars.";
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
        general: result.error?.message || "Invalid credentials. Please try again.",
      }));
      return;
    }

    navigate("/tenant-dashboard");
  };

  const handleForgotPassword = async () => {
    setForgotError("");
    setForgotMessage("");

    if (!formData?.email) {
      setForgotError("Enter your email to receive the reset link.");
      return;
    }

    try {
      setForgotLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        { redirectTo: `${window.location.origin}/auth/reset-password` }
      );

      if (error) {
        console.error(error);
        setForgotError(error.message || "Could not send reset email. Try again.");
      } else {
        setForgotMessage("If the email exists, a reset link has been sent.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigate("/tenant-registration");
  };

  // --- RENDERIZADO VISUAL PRO ---
  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Alertas de Error Global */}
        {errors?.general && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 animate-in fade-in">
            <Icon name="AlertTriangle" size={18} className="text-red-600" />
            <p className="text-sm text-red-700 font-medium">{errors.general}</p>
          </div>
        )}

        {/* Alertas de Forgot Password */}
        {forgotError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 font-medium">
            {forgotError}
          </div>
        )}
        {forgotMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700 font-medium flex items-center gap-2">
            <Icon name="CheckCircle" size={16} /> {forgotMessage}
          </div>
        )}

        {/* Inputs */}
        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="name@company.com"
          value={formData?.email}
          onChange={handleInputChange}
          error={errors?.email}
          required
          disabled={isLoading || forgotLoading}
          className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
        />

        <div>
           <Input
             label="Password"
             type="password"
             name="password"
             placeholder="••••••••••"
             value={formData?.password}
             onChange={handleInputChange}
             error={errors?.password}
             required
             disabled={isLoading || forgotLoading}
             className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
           />
           <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                disabled={isLoading || forgotLoading}
              >
                {forgotLoading ? "Sending link..." : "Forgot password?"}
              </button>
           </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
           <Checkbox
             label="Remember me for 30 days"
             name="rememberMe"
             checked={formData?.rememberMe}
             onChange={handleInputChange}
             disabled={isLoading || forgotLoading}
           />
        </div>

        {/* Botón Principal */}
        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading || forgotLoading}
          className="bg-indigo-600 hover:bg-indigo-700 h-12 text-base shadow-md shadow-indigo-100 transition-all"
        >
          {isLoading ? "Signing in..." : "Sign In"}
          {!isLoading && <Icon name="ArrowRight" size={18} className="ml-2" />}
        </Button>

        {/* Footer: Crear Cuenta */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={handleCreateAccount}
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              disabled={isLoading || forgotLoading}
            >
              Create Workspace
            </button>
          </p>
        </div>

      </form>
    </div>
  );
};

export default LoginForm;