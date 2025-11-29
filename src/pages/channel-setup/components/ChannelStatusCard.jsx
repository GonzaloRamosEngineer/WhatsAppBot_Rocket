import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const ChannelStatusCard = ({ isConnected, channelData, onToggleChannel }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleChannel = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (onToggleChannel) {
        onToggleChannel(!channelData?.isActive);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return "text-muted-foreground";
    return channelData?.isActive ? "text-success" : "text-warning";
  };

  const getStatusText = () => {
    if (!isConnected) return "Sin conectar";
    return channelData?.isActive ? "Activo" : "Inactivo";
  };

  const getStatusIcon = () => {
    if (!isConnected) return "AlertCircle";
    return channelData?.isActive ? "CheckCircle" : "Clock";
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="MessageSquare" size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Estado del canal
            </h3>
            <p className="text-sm text-muted-foreground">
              Gestioná el estado del canal de WhatsApp seleccionado
            </p>
          </div>
        </div>

        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          <Icon name={getStatusIcon()} size={20} />
          <span className="font-medium">{getStatusText()}</span>
        </div>
      </div>
      {isConnected && channelData ? (
        <div className="space-y-4">
          {/* Información del canal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-md">
            <div>
              <label className="text-sm font-medium text-foreground">
                Nombre del negocio
              </label>
              <p className="text-sm text-muted-foreground">
                {channelData?.businessName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Número de WhatsApp
              </label>
              <p className="text-sm text-muted-foreground">
                {channelData?.phoneNumber || "No detectado (se completará al enviar mensajes)"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Verificación
              </label>
              <div className="flex items-center space-x-2">
                <Icon name="CheckCircle" size={16} className="text-success" />
                <span className="text-sm text-success">Verificado</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Última sincronización
              </label>
              <p className="text-sm text-muted-foreground">
                {channelData.lastSync
                  ? new Date(channelData.lastSync).toLocaleString()
                  : "Sincronización pendiente"}
              </p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between p-4 border border-border rounded-md">
            <div>
              <h4 className="font-medium text-foreground">
                Procesamiento de mensajes
              </h4>
              <p className="text-sm text-muted-foreground">
                {channelData?.isActive
                  ? "Este canal está procesando mensajes entrantes."
                  : "El procesamiento de mensajes está desactivado para este canal."}
              </p>
            </div>
            <Button
              onClick={handleToggleChannel}
              loading={isLoading}
              variant={channelData?.isActive ? "destructive" : "default"}
              iconName={channelData?.isActive ? "Pause" : "Play"}
              iconPosition="left"
            >
              {isLoading
                ? channelData?.isActive
                  ? "Desactivando..."
                  : "Activando..."
                : channelData?.isActive
                ? "Desactivar canal"
                : "Activar canal"}
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="MessageCircle" size={16} className="text-primary" />
                <span className="text-sm font-medium text-primary">
                  Mensajes hoy
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {channelData?.stats?.messagesToday || 0}
              </p>
            </div>

            <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Calendar" size={16} className="text-secondary" />
                <span className="text-sm font-medium text-secondary">
                  Este mes
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {channelData?.stats?.messagesThisMonth || 0}
              </p>
            </div>

            <div className="p-4 bg-accent/5 border border-accent/20 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Users" size={16} className="text-accent" />
                <span className="text-sm font-medium text-accent">
                  Chats activos
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {channelData?.stats?.activeChats || 0}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Icon
            name="AlertCircle"
            size={48}
            className="text-muted-foreground mx-auto mb-4"
          />
          <h4 className="text-lg font-medium text-foreground mb-2">
            Ningún canal conectado
          </h4>
          <p className="text-muted-foreground mb-4">
            Conectá tu cuenta de WhatsApp Business para ver el estado del canal.
          </p>
          <p className="text-sm text-muted-foreground">
            Completá las credenciales y realizá la prueba de conexión para
            comenzar.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChannelStatusCard;
