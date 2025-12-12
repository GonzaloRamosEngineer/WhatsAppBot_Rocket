// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ConversationStatusBadge.jsx
import React from "react";

export default function ConversationStatusBadge({ status }) {
  if (!status) return null;

  const normalized = status.toLowerCase();

  // Configuración de estilos
  const styles = {
    new: "bg-blue-50 text-blue-700 border-blue-200",
    open: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    pending_agent: "bg-amber-50 text-amber-700 border-amber-200",
    closed: "bg-slate-100 text-slate-600 border-slate-200",
    default: "bg-gray-50 text-gray-600 border-gray-200"
  };

  // Mapeo de etiquetas (Traducción/Formato)
  const labels = {
    new: "New",
    open: "Open",
    pending: "Pending",
    pending_agent: "Needs Agent",
    closed: "Resolved"
  };

  const currentStyle = styles[normalized] || styles.default;
  const label = labels[normalized] || status;

  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border 
      ${currentStyle}
    `}>
      {label}
    </span>
  );
}