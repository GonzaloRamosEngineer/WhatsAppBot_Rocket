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
    const { name, value, type, checked } = e?.target;
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
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData?.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData?.password) {
      newErrors.password = "Password is required";
    } else if (formData?.password?.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
        general: result.error?.message || "Invalid credentials",
      }));
      return;
    }

    // Login OK → vamos al dashboard del tenant
    navigate("/tenant-dashboard");
  };

  const handleForgotPassword = async () => {
    setForgotError("");
    setForgotMessage("");

    if (!formData?.email) {
      setForgotError("Please enter your email to receive the reset link.");
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
        setForgotError(error.message || "Could not send reset email.");
      } else {
        setForgotMessage(
          "If this email exists, we sent you a password reset link."
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
        {/* General Error Message */}
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

        {/* Email Input */}
        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="Enter your email address"
          value={formData?.email}
          onChange={handleInputChange}
          error={errors?.email}
          required
          disabled={isLoading || forgotLoading}
        />

        {/* Password Input */}
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="Enter your password"
          value={formData?.password}
          onChange={handleInputChange}
          error={errors?.password}
          required
          disabled={isLoading || forgotLoading}
        />

        {/* Remember Me Checkbox */}
        <Checkbox
          label="Remember me for 30 days"
          name="rememberMe"
          checked={formData?.rememberMe}
          onChange={handleInputChange}
          disabled={isLoading || forgotLoading}
        />

        {/* Sign In Button */}
        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading}
          iconName="LogIn"
          iconPosition="right"
        >
          Sign In
        </Button>

        {/* Additional Links */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-center text-sm text-primary hover:text-primary/80 micro-animation"
            disabled={isLoading || forgotLoading}
          >
            {forgotLoading ? "Sending reset link…" : "Forgot your password?"}
          </button>

          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              Don't have an account?{" "}
            </span>
            <button
              type="button"
              onClick={handleCreateAccount}
              className="text-sm text-primary hover:text-primary/80 font-medium micro-animation"
              disabled={isLoading || forgotLoading}
            >
              Create Account
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
