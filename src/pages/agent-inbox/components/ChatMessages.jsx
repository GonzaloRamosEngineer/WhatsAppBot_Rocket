// src/pages/agent-inbox/components/ChatMessages.jsx
import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatMessages({ messages, loading, error }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length]);

  return (
    <div className="flex-1 overflow-y-auto bg-background px-4 py-3">
      {loading && (
        <div className="text-xs text-muted-foreground">Cargando mensajes...</div>
      )}

      {error && !loading && (
        <div className="text-xs text-red-500">Error: {String(error)}</div>
      )}

      {!loading && !error && (!messages || messages.length === 0) && (
        <div className="text-xs text-muted-foreground">
          No hay mensajes en esta conversación todavía.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {messages?.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
