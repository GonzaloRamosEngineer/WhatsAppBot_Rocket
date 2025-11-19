// src/pages/agent-inbox/components/ConversationListItem.jsx
import React from "react";
import ConversationStatusBadge from "./ConversationStatusBadge";

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationListItem({
  conversation,
  selected,
  onClick,
}) {
  const phone = conversation.contact_phone || "Sin teléfono";
  const lastMessageAt = formatDateTime(conversation.last_message_at);

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
          selected
            ? "bg-primary/10 hover:bg-primary/20"
            : "hover:bg-muted/70"
        }`}
      >
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium truncate">{phone}</span>
            {lastMessageAt && (
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {lastMessageAt}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <ConversationStatusBadge status={conversation.status} />
            {conversation.assigned_agent && (
              <span className="text-[10px] text-muted-foreground">
                Asignada
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
