// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\MessageBubble.jsx
import React from "react";
import Icon from "../../../components/AppIcon";

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
  const isOutbound = message.direction === "out" || message.direction === "outbound";
  const isTemplate = message.body?.startsWith("[TEMPLATE]") || message.meta?.whatsapp_template;
  const time = formatTime(message.created_at);

  return (
    <div className={`flex w-full mb-1 ${isOutbound ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          relative max-w-[85%] md:max-w-[70%] px-3 py-2 text-sm shadow-sm rounded-lg
          ${isOutbound 
            ? "bg-indigo-100 text-slate-800 rounded-tr-none" // Agente (Color suave)
            : "bg-white text-slate-800 rounded-tl-none border border-slate-100" // Cliente (Blanco)
          }
        `}
      >
        {/* Contenido del Mensaje */}
        <div className="whitespace-pre-wrap break-words leading-relaxed text-[13px]">
          {isTemplate ? (
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1">
                   <Icon name="LayoutTemplate" size={10} /> Template
                </span>
                <span className="italic opacity-80">{message.body}</span>
             </div>
          ) : (
             message.body
          )}
        </div>

        {/* Metadatos (Hora + Checks) */}
        <div className={`flex items-center justify-end gap-1 mt-1 select-none ${isOutbound ? "opacity-70" : "opacity-50"}`}>
          <span className="text-[10px]">{time}</span>
          
          {/* Solo mostramos checks si es mensaje saliente */}
          {isOutbound && (
            <span title={message.status || "sent"}>
               {/* Lógica simple de iconos de estado */}
               {message.status === 'read' ? (
                  <Icon name="CheckCheck" size={12} className="text-blue-500" />
               ) : message.status === 'delivered' ? (
                  <Icon name="CheckCheck" size={12} />
               ) : (
                  <Icon name="Check" size={12} />
               )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}