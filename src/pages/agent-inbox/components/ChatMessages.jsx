// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ChatMessages.jsx

import React, { useEffect, useRef } from "react";
import clsx from "clsx";

export default function ChatMessages({ messages, loading, error }) {
  const endRef = useRef(null);

  // Auto-scroll al último mensaje cuando cambia la lista
  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length, loading]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-background px-6 py-4">
      {loading && (
        <div className="text-xs text-muted-foreground mb-2">
          Cargando mensajes...
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 mb-2">
          Error al cargar mensajes: {String(error)}
        </div>
      )}

      {!loading && !error && (!messages || messages.length === 0) && (
        <div className="text-xs text-muted-foreground">
          No hay mensajes todavía en esta conversación.
        </div>
      )}

      <div className="space-y-2">
        {messages?.map((msg) => {
          const isOutgoing = msg.direction === "out";
          const isBot = msg.sender === "bot";

          const createdAt = msg.created_at
            ? new Date(msg.created_at)
            : null;
          const timeLabel = createdAt
            ? createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return (
            <div
              key={msg.id}
              className={clsx(
                "flex",
                isOutgoing ? "justify-end" : "justify-start"
              )}
            >
              <div className="max-w-[70%]">
                <div
                  className={clsx(
                    "rounded-2xl px-3 py-2 text-xs leading-snug shadow-sm",
                    isOutgoing
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  <div className="whitespace-pre-line break-words">
                    {msg.body}
                  </div>
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground text-right">
                  {isBot ? "Bot · " : ""}
                  {timeLabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ancla para el auto-scroll */}
      <div ref={endRef} />
    </div>
  );
}
