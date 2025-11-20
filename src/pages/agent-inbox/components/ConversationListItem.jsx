// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ConversationListItem.jsx

import React from "react";
import clsx from "clsx";

const STATUS_LABELS = {
  new: "Nueva",
  open: "Abierta",
  pending: "Pendiente agente",
  closed: "Cerrada",
};

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-800",
  open: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  closed: "bg-slate-200 text-slate-800",
};

function formatShortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString([], {
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
  const displayName =
    conversation.contact_name?.trim() ||
    conversation.contact_phone ||
    "Contacto sin nombre";

  const statusLabel = STATUS_LABELS[conversation.status] || conversation.status;
  const statusColor =
    STATUS_COLORS[conversation.status] || "bg-slate-200 text-slate-800";

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          "w-full text-left px-3 py-2 text-xs hover:bg-accent/60 focus:outline-none",
          selected && "bg-accent"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground truncate">
                {displayName}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="truncate">
                {conversation.contact_phone || "Sin teléfono"}
              </span>
              <span
                className={clsx(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  statusColor
                )}
              >
                {statusLabel}
              </span>
            </div>
            {conversation.topic && (
              <div className="mt-0.5 text-[10px] text-muted-foreground truncate">
                Nota: {conversation.topic}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            {conversation.last_message_at && (
              <span className="text-[10px] text-muted-foreground">
                {formatShortDate(conversation.last_message_at)}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
