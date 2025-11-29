import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Icon from "../../../components/AppIcon";

const WebhookConfigCard = () => {
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${window.location?.origin}/api/webhooks/whatsapp`;
  const verifyToken = "whatsapp_webhook_verify_token_2024";

  const handleCopyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("No se pudo copiar al portapapeles:", error);
    }
  };

  const configSteps = [
    {
      step: 1,
      title: "Ingresar a Meta Business Manager",
      description:
        "Accedé a tu panel de Meta Business Manager y navegá a la sección de configuración de WhatsApp API.",
      link: "https://business.facebook.com",
    },
    {
      step: 2,
      title: "Configurar Webhook URL",
      description:
        "En la sección de Webhooks, agregá la URL de webhook que se muestra abajo.",
    },
    {
      step: 3,
      title: "Configurar Verify Token",
      description:
        "Ingresá el verify token exactamente como se muestra abajo para validar el webhook.",
    },
    {
      step: 4,
      title: "Suscribirse a los eventos",
      description:
        "Habilitá los eventos de mensajes, estados de entrega y estados de lectura.",
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
          <Icon name="Webhook" size={20} className="text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Configuración de Webhook
          </h3>
          <p className="text-sm text-muted-foreground">
            Configurá tu webhook de Meta para recibir mensajes de WhatsApp
          </p>
        </div>
      </div>

      {/* Pasos de configuración */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-foreground">Instrucciones</h4>
        <div className="space-y-3">
          {configSteps.map((step) => (
            <div key={step.step} className="flex space-x-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                {step.step}
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-foreground">
                  {step.title}
                </h5>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-primary hover:underline mt-1"
                  >
                    <span>Abrir Meta Business Manager</span>
                    <Icon name="ExternalLink" size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook URL */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Webhook URL
          </label>
          <div className="flex space-x-2">
            <Input
              type="text"
              value={webhookUrl}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              iconName={copied === "url" ? "Check" : "Copy"}
              onClick={() => handleCopyToClipboard(webhookUrl, "url")}
              className="flex-shrink-0"
            >
              {copied === "url" ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Usá esta URL en la configuración de Webhooks de tu cuenta de
            WhatsApp en Meta.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Verify Token
          </label>
          <div className="flex space-x-2">
            <Input
              type="text"
              value={verifyToken}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              iconName={copied === "token" ? "Check" : "Copy"}
              onClick={() => handleCopyToClipboard(verifyToken, "token")}
              className="flex-shrink-0"
            >
              {copied === "token" ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ingresá este token exactamente igual para que Meta valide tu
            webhook.
          </p>
        </div>
      </div>

      {/* Aviso de seguridad */}
      <div className="mt-6 p-4 bg-muted rounded-md">
        <div className="flex items-start space-x-3">
          <Icon
            name="Shield"
            size={20}
            className="text-primary flex-shrink-0 mt-0.5"
          />
          <div>
            <h5 className="font-medium text-foreground mb-1">
              Seguridad
            </h5>
            <p className="text-sm text-muted-foreground">
              Tu endpoint de webhook está protegido mediante verificación de
              token y transmisión cifrada. Todos los mensajes entrantes se
              validan antes de ser procesados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookConfigCard;
