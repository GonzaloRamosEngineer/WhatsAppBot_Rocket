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
  return (
    value
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tenant"
  );
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
      newErrors.organizationName = "El nombre de la organización es obligatorio.";
    }

    if (!formData.fullName?.trim()) {
      newErrors.fullName = "Tu nombre completo es obligatorio.";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "El email es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Ingresá un email válido.";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (formData.password.length < 8) {
      newErrors.password =
        "La contraseña debe tener al menos 8 caracteres.";
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = "Tenés que confirmar la contraseña.";
    } else if (formData.passwordConfirm !== formData.password) {
      newErrors.passwordConfirm = "Las contraseñas no coinciden.";
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
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
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
        setGeneralError(
          signUpError.message || "No pudimos crear la cuenta."
        );
        setIsSubmitting(false);
        return;
      }

      const user = signUpData?.user;
      const session = signUpData?.session;

      if (!user) {
        // Caso típico con confirmación de email
        setSuccessMessage(
          "Te enviamos un email de confirmación. Verificá tu cuenta y luego iniciá sesión."
        );
        setIsSubmitting(false);
        return;
      }

      // 2) Crear tenant
      const slug = slugify(organizationName);

      const { data: tenantInsert, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: organizationName.trim(),
          slug,
        })
        .select("id")
        .single();

      if (tenantError) {
        console.error("Error creando tenant", tenantError);
        setGeneralError(
          tenantError.message ||
            "No pudimos crear la organización / workspace."
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
        console.error("Error creando tenant member", memberError);
        setGeneralError(
          memberError.message ||
            "No pudimos vincular tu usuario con la organización."
        );
        setIsSubmitting(false);
        return;
      }

      // 4) Todo OK → mensaje + redirección
      setSuccessMessage(
        "Cuenta y workspace creados correctamente. Redirigiendo…"
      );
      setTimeout(() => {
        if (session) {
          navigate("/tenant-dashboard");
        } else {
          navigate("/login");
        }
      }, 1500);
    } catch (err) {
      console.error("Unexpected error on registration", err);
      setGeneralError("Ocurrió un error inesperado. Intentá nuevamente.");
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

      {/* Organización */}
      <Input
        label="Nombre de la organización / workspace"
        name="organizationName"
        placeholder="Ej. DigitalMatch, Fundación Evolución Antoniana"
        value={formData.organizationName}
        onChange={handleChange}
        error={errors.organizationName}
        disabled={isSubmitting}
        required
      />

      {/* Nombre completo */}
      <Input
        label="Nombre completo"
        name="fullName"
        placeholder="Ingresá tu nombre y apellido"
        value={formData.fullName}
        onChange={handleChange}
        error={errors.fullName}
        disabled={isSubmitting}
        required
      />

      {/* Email */}
      <Input
        label="Email de trabajo"
        type="email"
        name="email"
        placeholder="tu@empresa.com"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        disabled={isSubmitting}
        required
      />

      {/* Password */}
      <Input
        label="Contraseña"
        type="password"
        name="password"
        placeholder="Creá una contraseña segura"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        disabled={isSubmitting}
        required
      />

      {/* Confirm password */}
      <Input
        label="Confirmar contraseña"
        type="password"
        name="passwordConfirm"
        placeholder="Repetí la contraseña"
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
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta y workspace"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Al crear una cuenta aceptás nuestros{" "}
        <span className="underline cursor-pointer">Términos</span> y{" "}
        <span className="underline cursor-pointer">Política de privacidad</span>
        .
      </p>
    </form>
  );
};

export default TenantRegistrationForm;
