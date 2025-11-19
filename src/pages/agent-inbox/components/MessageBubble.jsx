// src/pages/agent-inbox/components/MessageBubble.jsx
import React from "react";

function formatTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({ message }) {
  const isOutbound = message.direction === "out"; // 👈 'out' desde webhook / send
  const time = formatTime(message.created_at);

  const alignment = isOutbound ? "items-end" : "items-start";
  const bubbleClasses = isOutbound
    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
    : "bg-muted text-foreground rounded-2xl rounded-bl-sm";

  return (
    <div className={`flex ${alignment}`}>
      <div className={`max-w-[80%] px-3 py-2 text-xs ${bubbleClasses}`}>
        <div className="whitespace-pre-wrap break-words">{message.body}</div>
        {time && (
          <div className="mt-0.5 text-[9px] opacity-80 text-right">
            {time}
          </div>
        )}
      </div>
    </div>
  );
}
