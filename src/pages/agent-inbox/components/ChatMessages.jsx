// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ChatMessages.jsx

import React, { useEffect, useRef } from "react";
import clsx from "clsx";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatMessages({ messages, loading, error }) {
  const containerRef = useRef(null);

  // Auto-scroll al último mensaje cuando cambia la lista
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages?.length]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-6 py-4 bg-background"
    >
      {loading && (
        <div className="text-xs text-muted-foreground">
          Cargando mensajes...
        </div>
      )}

      {error && !loading && (
        <div className="text-xs text-red-500">Error: {String(error)}</div>
      )}

      {!loading && !error && (!messages || messages.length === 0) && (
        <div className="text-xs text-muted-foreground">
          No hay mensajes todavía en esta conversación.
        </div>
      )}

      <div className="space-y-2">
        {messages.map((msg) => {
          const isOut = msg.direction === "out";
          const align = isOut ? "justify-end" : "justify-start";

          return (
            <div key={msg.id} className={clsx("flex", align)}>
              <div
                className={clsx(
                  "max-w-[70%] rounded-2xl px-3 py-2 text-xs shadow-sm",
                  isOut
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.body}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground/80 text-right">
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
