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

function summarizeContext(conversation) {
  const state = conversation?.context_state || null;
  const ctx = conversation?.context_data || {};

  if (ctx.modo_contacto === "email" && ctx.email) {
    return `Quiere contacto por email: ${ctx.email}`;
  }
  if (ctx.modo_contacto === "whatsapp") {
    return "Quiere que lo contacten por WhatsApp";
  }
  if (ctx.modo_contacto === "videollamada") {
    return "Quiere agendar una videollamada";
  }

  if (ctx.area || ctx.tipo_automatizacion || ctx.tipo_automatizacion_otro) {
    const partes = [];
    if (ctx.area) partes.push(ctx.area);
    if (ctx.tipo_automatizacion) partes.push(ctx.tipo_automatizacion);
    if (ctx.tipo_automatizacion_otro)
      partes.push(ctx.tipo_automatizacion_otro);
    return `Interesado en automatización: ${partes.join(" · ")}`;
  }

  if (ctx.budget_details) {
    const short =
      ctx.budget_details.length > 60
        ? ctx.budget_details.slice(0, 60) + "…"
        : ctx.budget_details;
    return `Pidiendo presupuesto: ${short}`;
  }

  if (state === "menu_principal") return "En menú principal";
  if (state === "info_servicios") return "Consultando info de servicios";
  if (state === "auto_closed") return "Cerrada automáticamente por inactividad";

  return null;
}

export default function ConversationListItem({
  conversation,
  selected,
  onClick,
  onDelete, // 👈 NUEVO
}) {
  const displayName =
    conversation.contact_name?.trim() ||
    conversation.contact_phone ||
    "Contacto sin nombre";

  const statusLabel = STATUS_LABELS[conversation.status] || conversation.status;
  const statusColor =
    STATUS_COLORS[conversation.status] || "bg-slate-200 text-slate-800";

  const contextSummary = summarizeContext(conversation);

  return (
    <li>
      <div
        className={clsx(
          "flex items-stretch",
          selected && "bg-accent/70",
          !selected && "hover:bg-accent/40"
        )}
      >
        {/* Botón principal para seleccionar */}
        <button
          type="button"
          onClick={onClick}
          className="flex-1 text-left px-3 py-2 text-xs focus:outline-none"
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
              {contextSummary && (
                <div className="mt-0.5 text-[10px] text-muted-foreground truncate">
                  {contextSummary}
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

        {/* Botón de borrar */}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-l border-border"
            title="Borrar conversación"
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  );
}
