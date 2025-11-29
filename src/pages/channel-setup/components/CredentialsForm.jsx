import React, { useState } from "react";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const emptyCreds = {
  phoneNumberId: "",
  wabaId: "",
  accessToken: "",
  businessName: "",
};

const CredentialsForm = ({ credentials, onCredentialsChange, onSave, isLoading }) => {
  const [errors, setErrors] = useState({});
  const [showToken, setShowToken] = useState(false);

  const current = credentials || emptyCreds;

  const handleInputChange = (field, value) => {
    const updated = {
      ...current,
      [field]: value,
    };

    if (onCredentialsChange) {
      onCredentialsChange(updated);
    }

    if (errors?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!current?.phoneNumberId?.trim()) {
      newErrors.phoneNumberId = "El Phone Number ID es obligatorio";
    } else if (!/^\d{5,20}$/.test(current.phoneNumberId)) {
      newErrors.phoneNumberId = "El Phone Number ID debe ser numérico";
    }

    if (!current?.wabaId?.trim()) {
      newErrors.wabaId = "El WhatsApp Business Account ID es obligatorio";
    } else if (!/^(\d{5,20}|waba_\d{5,30})$/.test(current.wabaId)) {
      newErrors.wabaId =
        'El WABA ID debe ser numérico o comenzar con "waba_" seguido de números';
    }

    if (!current?.accessToken?.trim()) {
      newErrors.accessToken = "El Access Token es obligatorio";
    } else if (current.accessToken.length < 50) {
      newErrors.accessToken =
        "El Access Token parece inválido (demasiado corto)";
    }

    if (!current?.businessName?.trim()) {
      newErrors.businessName = "El nombre del negocio es obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      if (onSave) {
        onSave(current);
      }
    }
  };

  const instructionSteps = [
    {
      title: "Obtener Phone Number ID",
      description:
        "En Meta Business Manager, ir a WhatsApp Manager → Phone Numbers → seleccionar tu número → copiar el Phone Number ID.",
    },
    {
      title: "Obtener WABA ID",
      description:
        "En WhatsApp Manager, localizar tu WhatsApp Business Account ID (WABA ID).",
    },
    {
      title: "Generar Access Token",
      description:
        "Ir a Meta for Developers → Tu App → WhatsApp → Getting Started → generar un token de acceso permanente.",
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon name="Key" size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Credenciales de WhatsApp Business
          </h3>
          <p className="text-sm text-muted-foreground">
            Ingresá las credenciales de la API de Meta Graph
          </p>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mb-6 p-4 bg-muted rounded-md">
        <h4 className="font-medium text-foreground mb-3 flex items-center">
          <Icon name="Info" size={16} className="mr-2" />
          Cómo obtener tus credenciales
        </h4>
        <div className="space-y-2">
          {instructionSteps.map((step, index) => (
            <div key={index} className="text-sm">
              <span className="font-medium text-foreground">
                {step.title}:
              </span>
              <span className="text-muted-foreground ml-1">
                {step.description}
              </span>
            </div>
          ))}
        </div>
        <a
          href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-sm text-primary hover:underline mt-2"
        >
          <span>Ver guía de configuración detallada</span>
          <Icon name="ExternalLink" size={14} />
        </a>
      </div>

      {/* Campos del formulario */}
      <div className="space-y-4">
        <Input
          label="Nombre del negocio"
          type="text"
          placeholder="Ingresá el nombre de tu negocio"
          value={current.businessName}
          onChange={(e) => handleInputChange("businessName", e.target.value)}
          error={errors?.businessName}
          required
          description="Nombre que verán los usuarios en tu cuenta de WhatsApp Business"
        />

        <Input
          label="Phone Number ID"
          type="text"
          placeholder="123456789012345"
          value={current.phoneNumberId}
          onChange={(e) => handleInputChange("phoneNumberId", e.target.value)}
          error={errors?.phoneNumberId}
          required
          description="ID numérico del número de teléfono en WhatsApp Manager"
        />

        <Input
          label="WhatsApp Business Account ID (WABA ID)"
          type="text"
          placeholder="1200748598356181 o waba_123456789"
          value={current.wabaId}
          onChange={(e) => handleInputChange("wabaId", e.target.value)}
          error={errors?.wabaId}
          required
          description="ID de tu cuenta de WhatsApp Business"
        />

        <div className="relative">
          <Input
            label="Access Token"
            type={showToken ? "text" : "password"}
            placeholder="EAABwzLixnjY..."
            value={current.accessToken}
            onChange={(e) => handleInputChange("accessToken", e.target.value)}
            error={errors?.accessToken}
            required
            description="Token de acceso permanente generado en Meta for Developers"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-8 text-muted-foreground hover:text-foreground"
          >
            <Icon name={showToken ? "EyeOff" : "Eye"} size={16} />
          </button>
        </div>
      </div>

      {/* Aviso de seguridad */}
      <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-md">
        <div className="flex items-start space-x-3">
          <Icon
            name="Shield"
            size={20}
            className="text-success flex-shrink-0 mt-0.5"
          />
          <div>
            <h5 className="font-medium text-success mb-1">
              Almacenamiento seguro
            </h5>
            <p className="text-sm text-success/80">
              Las credenciales se almacenan de forma segura. Tus tokens de
              acceso no se registran en logs ni se exponen públicamente.
            </p>
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          loading={isLoading}
          iconName="Save"
          iconPosition="left"
          disabled={
            !current.phoneNumberId ||
            !current.wabaId ||
            !current.accessToken ||
            !current.businessName
          }
        >
          {isLoading ? "Guardando credenciales..." : "Guardar credenciales"}
        </Button>
      </div>
    </div>
  );
};

export default CredentialsForm;
