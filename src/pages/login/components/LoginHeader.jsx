// C:\Projects\WhatsAppBot_Rocket\src\pages\login\components\LoginHeader.jsx

import React from "react";
import Icon from "../../../components/AppIcon";

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
          <Icon name="MessageSquare" size={24} color="white" />
        </div>
        <div className="ml-3">
          <h1 className="text-2xl font-bold text-foreground">
            DigitalMatch – MatchBot
          </h1>
          <p className="text-sm text-muted-foreground">
            Panel para administrar tu bot de WhatsApp
          </p>
        </div>
      </div>

      {/* Mensaje bienvenida */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Bienvenido de nuevo
        </h2>
        <p className="text-muted-foreground">
          Iniciá sesión para gestionar tus conversaciones y automatizaciones.
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;
