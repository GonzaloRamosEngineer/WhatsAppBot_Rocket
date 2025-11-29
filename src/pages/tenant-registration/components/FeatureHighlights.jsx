// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-registration\components\FeatureHighlights.jsx

import React from "react";
import Icon from "../../../components/AppIcon";

const FeatureHighlights = () => {
  const features = [
    {
      icon: "MessageCircle",
      title: "Respuestas automatizadas",
      description:
        "Configurá flujos de chatbot inteligentes para atender consultas 24/7.",
    },
    {
      icon: "BarChart3",
      title: "Métricas e insights",
      description:
        "Seguimiento de volumen de mensajes, tiempos de respuesta y satisfacción.",
    },
    {
      icon: "Users",
      title: "Soporte multi-agente",
      description:
        "Gestioná el acceso de tu equipo y asigná conversaciones a cada agente.",
    },
    {
      icon: "Zap",
      title: "Integración rápida",
      description:
        "Conectá tu número de WhatsApp Business en pocos pasos y sin fricción.",
    },
    {
      icon: "Shield",
      title: "Seguro y compliant",
      description:
        "Buenas prácticas de seguridad y privacidad para tus datos y los de tus clientes.",
    },
    {
      icon: "Clock",
      title: "Sincronización en tiempo real",
      description:
        "Mensajes instantáneos y actualización en vivo del estado de las conversaciones.",
    },
  ];

  return (
    <div className="bg-muted/30 rounded-xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          ¿Por qué usar MatchBot?
        </h2>
        <p className="text-muted-foreground">
          Todo lo que necesitás para automatizar y escalar tu atención por
          WhatsApp.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features?.map((feature, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name={feature?.icon} size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                {feature?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Indicadores de confianza */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Icon name="Shield" size={16} />
            <span>Conexión segura SSL</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Lock" size={16} />
            <span>Buenas prácticas de privacidad</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={16} />
            <span>Alta disponibilidad</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureHighlights;
