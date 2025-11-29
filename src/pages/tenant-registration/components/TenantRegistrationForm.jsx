// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-registration\components\TenantRegistrationForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Icon from "../../../components/AppIcon";
import { supabase } from "../../../lib/supabaseClient";

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
      newErrors.organizationName =
        "El nombre de la organización / workspace es obligatorio";
    }

    if (!formData.fullName?.trim()) {
      newErrors.fullName = "El nombre completo es obligatorio";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Ingresá un email válido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = "Tenés que confirmar la contraseña";
    } else if (formData.passwordConfirm !== formData.password) {
      newErrors.passwordConfirm = "Las contraseñas no coinciden";
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
          setGeneralError(
            "Ya existe una cuenta con este email. Probá iniciar sesión."
          );
        } else {
          setGeneralError(
            error.message ||
              "No pudimos crear la cuenta. Intentá nuevamente en unos minutos."
          );
        }

        setIsSubmitting(false);
        return;
      }

      const session = data?.session;

      // 2) NO creamos tenant ni tenant_members desde el frontend.
      //    Eso lo resuelve la función SQL init_tenant_if_empty + policies
      //    cuando el usuario confirma el correo e inicia sesión.

      if (!session) {
        // Flujo típico con confirmación de email
        setSuccessMessage(
          "Te enviamos un mail de confirmación desde DigitalMatch. " +
            "Revisá tu bandeja de entrada (y spam), confirmá tu correo y luego iniciá sesión."
        );
      } else {
        // Por si desactivás la confirmación de correo en el futuro
        setSuccessMessage(
          "Cuenta creada correctamente. Te vamos a redirigir a tu panel."
        );
      }

      // Redirigimos suave al login
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      console.error("Unexpected error on registration", err);
      setGeneralError("Error inesperado. Intentá nuevamente en unos minutos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mensaje de error general */}
      {generalError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center space-x-2">
          <Icon name="AlertCircle" size={16} className="text-red-600" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Nombre de organización */}
      <Input
        label="Nombre de la organización / workspace"
        name="organizationName"
        placeholder="Ej: DigitalMatch, Fundación Evolución Antoniana"
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
        placeholder="Ingresá tu nombre completo"
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

      {/* Contraseña */}
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

      {/* Confirmar contraseña */}
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
        <span className="underline cursor-pointer">
          Política de privacidad
        </span>
        .
      </p>
    </form>
  );
};

export default TenantRegistrationForm;
