// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ConversationListItem.jsx

import React from "react";
import clsx from "clsx";
import Icon from "../../../components/AppIcon"; // Asegúrate de tener este import

// Mantenemos tus mapeos de etiquetas
const STATUS_LABELS = {
  new: "Nueva",
  open: "Abierta",
  pending: "Pendiente",
  pending_agent: "Agente Req", // Abreviado para que entre mejor
  closed: "Cerrada",
};

// Colores refinados para estilo "Pill"
const STATUS_STYLES = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  open: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  pending_agent: "bg-orange-100 text-orange-800 border-orange-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
  default: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatShortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  // Lógica inteligente: Si es hoy muestra hora, si no muestra fecha
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  
  return isToday 
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// --- LÓGICA DE NEGOCIO INTACTA (Tu función original) ---
function summarizeContext(conversation) {
  const state = conversation?.context_state || null;
  const ctx = conversation?.context_data || {};

  if (ctx.modo_contacto === "email" && ctx.email) {
    return `Contacto por email: ${ctx.email}`;
  }
  if (ctx.modo_contacto === "whatsapp") {
    return "Prefiere contacto por WhatsApp";
  }
  if (ctx.modo_contacto === "videollamada") {
    return "Quiere videollamada";
  }

  if (ctx.area || ctx.tipo_automatizacion || ctx.tipo_automatizacion_otro) {
    const partes = [];
    if (ctx.area) partes.push(ctx.area);
    if (ctx.tipo_automatizacion) partes.push(ctx.tipo_automatizacion);
    if (ctx.tipo_automatizacion_otro) partes.push(ctx.tipo_automatizacion_otro);
    return `Interés: ${partes.join(" · ")}`;
  }

  if (ctx.budget_details) {
    const short = ctx.budget_details.length > 40
        ? ctx.budget_details.slice(0, 40) + "…"
        : ctx.budget_details;
    return `Presupuesto: ${short}`;
  }

  if (state === "menu_principal") return "En menú principal";
  if (state === "info_servicios") return "Viendo servicios";
  if (state === "auto_closed") return "Cerrada por inactividad";

  return conversation.topic || "Click para ver chat";
}

export default function ConversationListItem({
  conversation,
  selected,
  onClick,
  onDelete, 
}) {
  // Datos visuales
  const displayName = conversation.contact_name?.trim() || conversation.contact_phone || "Desconocido";
  const initial = displayName.charAt(0).toUpperCase();
  
  // Status
  const statusKey = conversation.status?.toLowerCase();
  const statusLabel = STATUS_LABELS[statusKey] || conversation.status;
  const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.default;

  // Contexto
  const contextSummary = summarizeContext(conversation);

  return (
    <li className="relative group border-b border-slate-50 last:border-0">
      <div
        onClick={onClick}
        className={clsx(
          "flex items-start gap-3 p-3 cursor-pointer transition-all duration-200 border-l-4",
          selected 
            ? "bg-indigo-50/60 border-indigo-500" // Estado Seleccionado
            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200" // Estado Normal
        )}
      >
        {/* Avatar (Visual Upgrade) */}
        <div className={clsx(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold shadow-sm",
            selected 
                ? "bg-indigo-500 text-white shadow-indigo-200" 
                : "bg-slate-200 text-slate-500"
        )}>
            {initial}
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
            
            {/* Fila 1: Nombre y Fecha */}
            <div className="flex justify-between items-baseline">
                <span className={clsx("text-sm font-bold truncate pr-2", selected ? "text-slate-900" : "text-slate-700")}>
                    {displayName}
                </span>
                {conversation.last_message_at && (
                    <span className={clsx("text-[10px] whitespace-nowrap shrink-0", selected ? "text-indigo-600 font-medium" : "text-slate-400")}>
                        {formatShortDate(conversation.last_message_at)}
                    </span>
                )}
            </div>

            {/* Fila 2: Resumen del Contexto (Lógica de negocio aquí) */}
            <p className="text-xs text-slate-500 truncate min-h-[1.2em]">
                {contextSummary}
            </p>

            {/* Fila 3: Badges y Acciones */}
            <div className="flex items-center justify-between mt-1">
                {/* Status Badge */}
                <span className={clsx("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border", statusStyle)}>
                    {statusLabel}
                </span>

                {/* Botón Borrar (Solo visible en hover) */}
                {onDelete && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation(); // Evitar seleccionar al borrar
                            onDelete();
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                        title="Borrar conversación"
                    >
                        <Icon name="Trash2" size={14} />
                    </button>
                )}
            </div>
        </div>
      </div>
    </li>
  );
}