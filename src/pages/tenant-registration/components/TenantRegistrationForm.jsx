// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-registration\components\TenantRegistrationForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Icon from "../../../components/AppIcon";
import { supabase } from "../../../lib/supabaseClient";

const TenantRegistrationForm = () => {
  const navigate = useNavigate();

  // --- LÓGICA INTACTA ---
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
    if (!formData.organizationName?.trim()) newErrors.organizationName = "Workspace name is required";
    if (!formData.fullName?.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email?.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Must be at least 8 characters";
    if (!formData.passwordConfirm) newErrors.passwordConfirm = "Please confirm password";
    else if (formData.passwordConfirm !== formData.password) newErrors.passwordConfirm = "Passwords do not match";

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            organization_name: organizationName,
          },
        },
      });

      if (error) {
        console.error("Sign up error", error);
        if (error.code === "user_already_exists") {
          setGeneralError("An account with this email already exists. Try signing in.");
        } else {
          setGeneralError(error.message || "Unable to create account. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      const session = data?.session;

      if (!session) {
        setSuccessMessage(
          "We've sent a confirmation email. Please check your inbox (and spam folder) to verify your account."
        );
      } else {
        setSuccessMessage(
          "Account created successfully! Redirecting to dashboard..."
        );
      }

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      console.error("Unexpected error on registration", err);
      setGeneralError("Unexpected error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERIZADO VISUAL PRO ---
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Alertas */}
      {generalError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 animate-in fade-in">
          <Icon name="AlertTriangle" size={18} className="text-red-600 mt-0.5 shrink-0" />
          <span className="text-sm text-red-700 font-medium">{generalError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-3 animate-in fade-in">
          <Icon name="CheckCircle" size={18} className="text-emerald-600 mt-0.5 shrink-0" />
          <span className="text-sm text-emerald-700 font-medium">{successMessage}</span>
        </div>
      )}

      {/* Inputs */}
      <Input
        label="Workspace Name"
        name="organizationName"
        placeholder="e.g. Acme Corp"
        value={formData.organizationName}
        onChange={handleChange}
        error={errors.organizationName}
        disabled={isSubmitting}
        required
        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
      />

      <Input
        label="Full Name"
        name="fullName"
        placeholder="John Doe"
        value={formData.fullName}
        onChange={handleChange}
        error={errors.fullName}
        disabled={isSubmitting}
        required
        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
      />

      <Input
        label="Work Email"
        type="email"
        name="email"
        placeholder="name@company.com"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        disabled={isSubmitting}
        required
        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="Min 8 chars"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          disabled={isSubmitting}
          required
          className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
        />

        <Input
          label="Confirm Password"
          type="password"
          name="passwordConfirm"
          placeholder="Repeat password"
          value={formData.passwordConfirm}
          onChange={handleChange}
          error={errors.passwordConfirm}
          disabled={isSubmitting}
          required
          className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
        />
      </div>

      <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={isSubmitting}
        className="bg-indigo-600 hover:bg-indigo-700 h-12 text-base shadow-md shadow-indigo-100 transition-all mt-4"
      >
        {isSubmitting ? "Creating Workspace..." : "Create Account"}
        {!isSubmitting && <Icon name="ArrowRight" size={18} className="ml-2" />}
      </Button>

      <p className="text-xs text-slate-400 text-center mt-4">
        By creating an account, you agree to our <span className="underline hover:text-slate-600 cursor-pointer">Terms</span> and <span className="underline hover:text-slate-600 cursor-pointer">Privacy Policy</span>.
      </p>
    </form>
  );
};

export default TenantRegistrationForm;