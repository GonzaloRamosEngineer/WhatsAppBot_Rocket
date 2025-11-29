// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-dashboard\components\ActiveConversations.jsx

import React from "react";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";

const ActiveConversations = ({ conversations = [], isLoading = false }) => {
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Sin actividad";

    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Activo ahora";
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440)
      return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return time?.toLocaleDateString("es-ES");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-success";
      case "pending":
        return "bg-warning";
      case "resolved":
        return "bg-muted-foreground";
      default:
        return "bg-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Conversaciones activas
        </h3>
        <div className="space-y-4">
          {[1, 2, 3]?.map((i) => (
            <div
              key={i}
              className="flex items-center space-x-3 p-3 animate-pulse"
            >
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Conversaciones activas
        </h3>
        <span className="text-sm text-muted-foreground">
          {conversations?.length} activas
        </span>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {conversations?.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              name="MessageCircle"
              size={48}
              className="text-muted-foreground mx-auto mb-3"
            />
            <p className="text-muted-foreground">
              No hay conversaciones activas
            </p>
            <p className="text-sm text-muted-foreground">
              Las nuevas conversaciones van a aparecer acá.
            </p>
          </div>
        ) : (
          conversations?.map((conversation) => (
            <div
              key={conversation?.id}
              className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-md micro-animation cursor-pointer"
            >
              <div className="relative">
                <Image
                  src={conversation?.avatar}
                  alt={conversation?.avatarAlt}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(
                    conversation?.status
                  )}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">
                    {conversation?.name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatLastSeen(conversation?.lastSeen)}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground truncate">
                  {conversation?.lastMessage}
                </p>

                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {conversation?.phone}
                  </span>
                  {conversation?.unreadCount > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      {conversation?.unreadCount}
                    </span>
                  )}
                </div>
              </div>

              <Icon
                name="ChevronRight"
                size={16}
                className="text-muted-foreground"
              />
            </div>
          ))
        )}
      </div>
      {conversations?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <button className="w-full text-sm text-primary hover:text-primary/80 micro-animation">
            Ver todas las conversaciones
          </button>
        </div>
      )}
    </div>
  );
};

export default ActiveConversations;
