// C:\Projects\WhatsAppBot_Rocket\src\pages\login\components\SecurityBadges.jsx

import React from "react";
import Icon from "../../../components/AppIcon";

const SecurityBadges = () => {
  const securityFeatures = [
    {
      icon: "Shield",
      text: "Conexión cifrada SSL",
      description: "Toda la información viaja protegida con cifrado SSL.",
    },
    {
      icon: "Lock",
      text: "Autenticación segura",
      description: "Múltiples capas de seguridad para tus credenciales.",
    },
    {
      icon: "CheckCircle",
      text: "Estándares enterprise",
      description: "Buenas prácticas de seguridad a nivel empresarial.",
    },
  ];

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="text-center mb-4">
        <p className="text-xs text-muted-foreground font-medium">
          Pensado para equipos que toman en serio la seguridad.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {securityFeatures?.map((feature, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 micro-animation"
            title={feature?.description}
          >
            <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center mb-2">
              <Icon name={feature?.icon} size={16} className="text-success" />
            </div>
            <span className="text-xs font-medium text-foreground">
              {feature?.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityBadges;
