import React from "react";
import Icon from "../../../components/AppIcon";

const ChannelSelector = ({
  channels,
  selectedChannelId,
  onSelectChannel,
}) => {
  const hasChannels = channels && channels.length > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon name="Phone" size={18} className="text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Números de WhatsApp
            </h2>
            <p className="text-xs text-muted-foreground">
              Podés gestionar varios números de WhatsApp por cada tenant.
            </p>
          </div>
        </div>
      </div>

      {hasChannels ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {channels.map((channel) => {
            const isSelected = channel.id === selectedChannelId;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelectChannel(channel.id)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs md:text-sm micro-animation ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-foreground border-border hover:bg-muted/80"
                }`}
              >
                <Icon
                  name="MessageCircle"
                  size={14}
                  className={isSelected ? "mr-1.5" : "mr-1.5 text-muted-foreground"}
                />
                <span className="truncate max-w-[160px]">
                  {channel.display_name || "WhatsApp sin nombre"}
                </span>
                {channel.status === "active" && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-success/20 text-success text-[10px]">
                    Activo
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-3">
          Todavía no tenés ningún número de WhatsApp configurado para este
          tenant. Empezá creando el primero con el botón de abajo.
        </p>
      )}

      <button
        type="button"
        onClick={() => onSelectChannel(null)}
        className="inline-flex items-center px-3 py-1.5 rounded-md border border-dashed border-primary text-primary text-xs md:text-sm hover:bg-primary/5 micro-animation"
      >
        <Icon name="Plus" size={14} className="mr-1.5" />
        {hasChannels ? "Agregar nuevo número" : "Crear primer número"}
      </button>
    </div>
  );
};

export default ChannelSelector;
