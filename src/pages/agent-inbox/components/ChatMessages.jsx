// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ChatMessages.jsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import clsx from "clsx";

function formatTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatMessages({ messages, loading, error }) {
  const containerRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Auto scroll al final cuando cambian los mensajes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [messages?.length]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Si estamos a más de 120px del fondo, mostramos el botón
    setShowScrollToBottom(distanceFromBottom > 120);
  }, []);

  const handleScrollToBottom = () => {
    const el = containerRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex-1 min-h-0 relative">
      {/* Contenedor scrolleable */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto px-6 py-4 space-y-2 bg-background"
      >
        {loading && (
          <div className="text-xs text-muted-foreground">
            Cargando mensajes...
          </div>
        )}

        {error && !loading && (
          <div className="text-xs text-destructive">
            Error al cargar mensajes: {String(error)}
          </div>
        )}

        {!loading && !error && (!messages || messages.length === 0) && (
          <div className="text-xs text-muted-foreground">
            No hay mensajes en esta conversación todavía.
          </div>
        )}

        {messages &&
          messages.map((msg) => {
            const isOutgoing = msg.direction === "out";
            const isBot = msg.sender === "bot";

            return (
              <div
                key={msg.id}
                className={clsx(
                  "flex w-full",
                  isOutgoing ? "justify-end" : "justify-start"
                )}
              >
                <div className="max-w-[70%] flex flex-col gap-0.5">
                  {/* Bubble */}
                  <div
                    className={clsx(
                      "rounded-2xl px-3 py-2 text-xs leading-snug shadow-sm",
                      isOutgoing
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    <span>{msg.body}</span>
                    {isBot && (
                      <span className="block mt-1 text-[10px] opacity-80">
                        Bot
                      </span>
                    )}
                  </div>

                  {/* Hora */}
                  <span className="text-[10px] text-muted-foreground px-1">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Botón flotante para bajar al final */}
      {showScrollToBottom && (
        <button
          type="button"
          onClick={handleScrollToBottom}
          className="absolute right-4 bottom-20 rounded-full border border-border bg-card px-3 py-1 text-[11px] shadow-sm hover:bg-muted"
        >
          Ir al último mensaje
        </button>
      )}
    </div>
  );
}
