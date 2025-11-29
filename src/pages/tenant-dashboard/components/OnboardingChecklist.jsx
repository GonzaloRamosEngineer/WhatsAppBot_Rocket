// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-dashboard\components\OnboardingChecklist.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const OnboardingChecklist = ({
  onComplete,
  isChannelConnected = false,
  hasFlows = false,
  hasMessages = false,
}) => {
  const navigate = useNavigate();

  const steps = [
    {
      id: "profile",
      title: "Completar perfil del workspace",
      description:
        "Agregá la información básica de tu negocio y datos de contacto.",
      icon: "User",
      completed: true, // asumimos creado
    },
    {
      id: "channel",
      title: "Conectar canal de WhatsApp",
      description:
        "Vinculá tu número de WhatsApp Business para empezar a enviar y recibir mensajes.",
      icon: "MessageSquare",
      completed: isChannelConnected,
      action: "Configurar canal",
    },
    {
      id: "flow",
      title: "Crear el primer flujo de chatbot",
      description:
        "Diseñá un mensaje de bienvenida automatizado para tus clientes.",
      icon: "GitBranch",
      completed: hasFlows,
      action: "Crear flujo",
    },
    {
      id: "test",
      title: "Enviar mensaje de prueba",
      description:
        "Probá toda la configuración enviando un mensaje real a tu bot.",
      icon: "Send",
      completed: hasMessages,
      action: "Enviar prueba",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  const handleStepAction = (stepId) => {
    switch (stepId) {
      case "channel":
        navigate("/channel-setup");
        break;
      case "flow":
        navigate("/flow-builder");
        break;
      case "test":
        navigate("/messages-log");
        break;
      default:
        break;
    }

    if (onComplete) {
      onComplete(stepId);
    }
  };

  if (completedCount === steps.length) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Primeros pasos
        </h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{steps.length} completados
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Progreso de configuración
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Pasos */}
      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-start space-x-3 p-3 rounded-md ${
              step.completed
                ? "bg-success/5 border border-success/20"
                : "bg-muted/30"
            }`}
          >
            <div
              className={`p-2 rounded-full ${
                step.completed
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon
                name={step.completed ? "Check" : step.icon}
                size={16}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4
                  className={`text-sm font-medium ${
                    step.completed ? "text-success" : "text-foreground"
                  }`}
                >
                  {step.title}
                </h4>
                {step.completed && (
                  <Icon
                    name="CheckCircle"
                    size={16}
                    className="text-success"
                  />
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {step.description}
              </p>

              {!step.completed && step.action && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStepAction(step.id)}
                  className="mt-2"
                >
                  {step.action}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {completedCount > 0 && completedCount < steps.length && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            ¡Buen progreso! Completá los pasos restantes para desbloquear
            todas las funcionalidades.
          </p>
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;
