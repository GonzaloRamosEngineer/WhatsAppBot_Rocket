import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const TroubleshootingCard = () => {
  const [expandedItem, setExpandedItem] = useState(null);

  const troubleshootingItems = [
    {
      id: "invalid-credentials",
      title: "Error de credenciales inválidas",
      description:
        "La prueba de conexión falla por errores de autenticación",
      solution: `Verificá que tu Phone Number ID y WABA ID sean correctos.\nAsegurate de que el access token sea permanente y no esté vencido.\nConfirmá que tu app tenga los permisos de WhatsApp necesarios.\nRevisá que el número esté verificado en Meta Business Manager.`,
      icon: "Key",
    },
    {
      id: "webhook-not-receiving",
      title: "El webhook no recibe mensajes",
      description: "Los mensajes no aparecen en el panel de DigitalMatch",
      solution: `Verificá que la URL de webhook esté configurada correctamente en Meta Business Manager.\nComprobá que el verify token coincida exactamente.\nAsegurate de tener suscripciones activas a los eventos de mensajes.\nProbá la accesibilidad del endpoint desde redes externas.`,
      icon: "Webhook",
    },
    {
      id: "rate-limits",
      title: "Problemas de rate limit",
      description:
        "Las llamadas a la API son limitadas o rechazadas por exceso",
      solution: `Revisá el uso actual de la API en Meta Business Manager.\nImplementá un sistema de colas para alto volumen de mensajes.\nConsiderá actualizar el nivel de tu API de WhatsApp Business.\nMonitoreá los headers de rate limit en las respuestas de la API.`,
      icon: "Clock",
    },
    {
      id: "message-delivery",
      title: "Problemas de entrega de mensajes",
      description:
        "Los mensajes no llegan a los destinatarios o quedan pendientes",
      solution: `Verificá el formato de los números de destinatario (incluyendo código de país).\nComprobá que tu negocio esté aprobado para enviar mensajes.\nSi usás plantillas, asegurate de que estén aprobadas.\nRevisá que el contenido no viole políticas de WhatsApp.`,
      icon: "MessageCircle",
    },
    {
      id: "permissions",
      title: "Errores de permisos denegados",
      description:
        "La API devuelve errores de permisos o acceso denegado",
      solution: `Verificá que tu app tenga el permiso whatsapp_business_messaging.\nRevisá que el access token incluya los scopes correspondientes.\nConfirmá que tu cuenta de Business Manager tenga los roles adecuados.\nComprobá que el número haya sido agregado correctamente a tu WABA.`,
      icon: "Shield",
    },
  ];

  const toggleExpanded = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const contactSupport = () => {
    window.open(
      "mailto:soporte@digitalmatchglobal.com?subject=Ayuda%20en%20configuraci%C3%B3n%20de%20canal",
      "_blank"
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
          <Icon name="HelpCircle" size={20} className="text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Guía de resolución de problemas
          </h3>
          <p className="text-sm text-muted-foreground">
            Errores frecuentes y cómo solucionarlos
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {troubleshootingItems.map((item) => (
          <div key={item.id} className="border border-border rounded-md">
            <button
              onClick={() => toggleExpanded(item.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted micro-animation"
            >
              <div className="flex items-center space-x-3">
                <Icon
                  name={item.icon}
                  size={20}
                  className="text-muted-foreground"
                />
                <div>
                  <h4 className="font-medium text-foreground">
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <Icon
                name={expandedItem === item.id ? "ChevronUp" : "ChevronDown"}
                size={20}
                className="text-muted-foreground flex-shrink-0"
              />
            </button>

            {expandedItem === item.id && (
              <div className="px-4 pb-4">
                <div className="pl-8 border-l-2 border-primary/20">
                  <h5 className="font-medium text-foreground mb-2">
                    Solución:
                  </h5>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {item.solution.split("\n").map((line, index) => (
                      <p key={index}>• {line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Links rápidos */}
      <div className="mt-6 p-4 bg-muted rounded-md">
        <h4 className="font-medium text-foreground mb-3">
          Enlaces útiles
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <a
            href="https://developers.facebook.com/docs/whatsapp/business-management-api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-primary hover:underline"
          >
            <Icon name="ExternalLink" size={14} />
            <span>Docs WhatsApp Business API</span>
          </a>
          <a
            href="https://business.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-primary hover:underline"
          >
            <Icon name="ExternalLink" size={14} />
            <span>Meta Business Manager</span>
          </a>
          <a
            href="https://developers.facebook.com/tools/debug/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-primary hover:underline"
          >
            <Icon name="ExternalLink" size={14} />
            <span>Access Token Debugger</span>
          </a>
          <button
            onClick={contactSupport}
            className="flex items-center space-x-2 text-sm text-primary hover:underline text-left"
          >
            <Icon name="Mail" size={14} />
            <span>Contactar soporte</span>
          </button>
        </div>
      </div>

      {/* Contacto soporte */}
      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-md">
        <div className="flex items-start space-x-3">
          <Icon
            name="MessageSquare"
            size={20}
            className="text-primary flex-shrink-0 mt-0.5"
          />
          <div>
            <h5 className="font-medium text-primary mb-1">
              ¿Necesitás ayuda adicional?
            </h5>
            <p className="text-sm text-primary/80 mb-3">
              Nuestro equipo puede ayudarte con casos complejos de
              configuración o integraciones personalizadas.
            </p>
            <Button
              variant="outline"
              size="sm"
              iconName="Mail"
              iconPosition="left"
              onClick={contactSupport}
            >
              Escribir al equipo de soporte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingCard;
