// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-registration\components\TenantRegistrationForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Icon from "../../../components/AppIcon";
import { supabase } from "../../../lib/supabaseClient";

// Helper simple para slug
const slugify = (value) => {
  if (!value) return "tenant";
  return value
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "tenant";
};

const TenantRegistrationForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    organizationName: "",
    fullName: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e?.target || {};
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors?.[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (generalError) setGeneralError("");
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.organizationName?.trim()) {
      newErrors.organizationName = "Organization name is required";
    }

    if (!formData.fullName?.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = "Please confirm your password";
    } else if (formData.passwordConfirm !== formData.password) {
      newErrors.passwordConfirm = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setGeneralError("");
    setSuccessMessage("");

    if (!validate()) return;

    setIsSubmitting(true);

    const { organizationName, fullName, email, password } = formData;

    try {
      // 1) Alta de usuario en Supabase Auth
      const {
        data: signUpData,
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        console.error("Sign up error", signUpError);
        setGeneralError(signUpError.message || "Could not create account.");
        setIsSubmitting(false);
        return;
      }

      const user = signUpData?.user;
      const session = signUpData?.session;

      if (!user) {
        // Caso típico cuando tenés confirmación de email activada
        setSuccessMessage(
          "We’ve sent you a confirmation email. Please confirm your account and then sign in."
        );
        setIsSubmitting(false);
        return;
      }

      // 2) Crear tenant
      const slug = slugify(organizationName);

      const {
        data: tenantInsert,
        error: tenantError,
      } = await supabase
        .from("tenants")
        .insert({
          name: organizationName.trim(),
          slug,
        })
        .select("id")
        .single();

      if (tenantError) {
        console.error("Error creating tenant", tenantError);
        setGeneralError(
          tenantError.message || "Could not create organization."
        );
        setIsSubmitting(false);
        return;
      }

      // 3) Crear tenant_member como owner
      const { error: memberError } = await supabase
        .from("tenant_members")
        .insert({
          tenant_id: tenantInsert.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) {
        console.error("Error creating tenant member", memberError);
        setGeneralError(
          memberError.message ||
            "Could not link your user with the organization."
        );
        setIsSubmitting(false);
        return;
      }

      // 4) Todo OK → mensaje + redirección
      setSuccessMessage("Account created successfully. Redirecting...");
      setTimeout(() => {
        // Si ya hay sesión, vamos directo al dashboard
        if (session) {
          navigate("/tenant-dashboard");
        } else {
          // fallback por si tenés confirmación de email
          navigate("/login");
        }
      }, 1500);
    } catch (err) {
      console.error("Unexpected error on registration", err);
      setGeneralError("Unexpected error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mensajes generales */}
      {generalError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center space-x-2">
          <Icon name="AlertCircle" size={16} className="text-red-600" />
          <span>{generalError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Organization */}
      <Input
        label="Organization / Workspace name"
        name="organizationName"
        placeholder="e.g. DigitalMatch, Fundación Evolución Antoniana"
        value={formData.organizationName}
        onChange={handleChange}
        error={errors.organizationName}
        disabled={isSubmitting}
        required
      />

      {/* Full name */}
      <Input
        label="Full name"
        name="fullName"
        placeholder="Enter your full name"
        value={formData.fullName}
        onChange={handleChange}
        error={errors.fullName}
        disabled={isSubmitting}
        required
      />

      {/* Email */}
      <Input
        label="Work email"
        type="email"
        name="email"
        placeholder="you@company.com"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        disabled={isSubmitting}
        required
      />

      {/* Password */}
      <Input
        label="Password"
        type="password"
        name="password"
        placeholder="Create a secure password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        disabled={isSubmitting}
        required
      />

      {/* Confirm password */}
      <Input
        label="Confirm password"
        type="password"
        name="passwordConfirm"
        placeholder="Re-enter your password"
        value={formData.passwordConfirm}
        onChange={handleChange}
        error={errors.passwordConfirm}
        disabled={isSubmitting}
        required
      />

      <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={isSubmitting}
        iconName="UserPlus"
        iconPosition="right"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By creating an account you agree to our{" "}
        <span className="underline cursor-pointer">Terms</span> and{" "}
        <span className="underline cursor-pointer">Privacy Policy</span>.
      </p>
    </form>
  );
};

export default TenantRegistrationForm;
