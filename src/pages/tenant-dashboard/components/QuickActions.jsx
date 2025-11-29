import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Crear nuevo flujo",
      description: "Diseñá conversaciones automatizadas para tu bot.",
      icon: "GitBranch",
      variant: "default",
      onClick: () => navigate("/flow-builder"),
    },
    {
      title: "Configurar canal",
      description: "Conectá tu número de WhatsApp Business.",
      icon: "MessageSquare",
      variant: "outline",
      onClick: () => navigate("/channel-setup"),
    },
    {
      title: "Ver mensajes",
      description: "Revisá el historial y los logs de conversación.",
      icon: "MessageCircle",
      variant: "outline",
      onClick: () => navigate("/messages-log"),
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Acciones rápidas
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions?.map((action, index) => (
          <div
            key={index}
            className="p-4 border border-border rounded-lg hover:shadow-md micro-animation"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Button
                  variant="ghost"
                  iconName={action?.icon}
                  iconSize={24}
                  onClick={action?.onClick}
                  className="p-0 h-auto hover:bg-transparent"
                />
              </div>

              <div className="space-y-1">
                <h4 className="font-medium text-foreground">
                  {action?.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {action?.description}
                </p>
              </div>

              <Button
                variant={action?.variant}
                size="sm"
                onClick={action?.onClick}
                fullWidth
              >
                Ir
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
