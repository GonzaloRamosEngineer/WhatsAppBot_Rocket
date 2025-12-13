// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ChatHeader.jsx

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import Icon from "../../../components/AppIcon"; // Asegúrate de importar tus iconos

const STATUS_LABELS = {
  new: "New",
  open: "Open",
  pending: "Pending Agent",
  closed: "Close",
};

const STATUS_COLORS = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
};

const CONTEXT_STATE_LABELS = {
  inicio: "Inicio",
  menu_principal: "Menú principal",
  esperando_area: "Esperando área",
  esperando_area_otro: "Esperando área (otro)",
  esperando_tipo_automatizacion: "Esperando tipo de automatización",
  esperando_tipo_otro: "Esperando tipo (otro)",
  esperando_contacto: "Esperando preferencia de contacto",
  esperando_email: "Esperando email",
  info_servicios: "Info de servicios",
  esperando_presupuesto: "Esperando detalle de presupuesto",
  esperando_seguimiento: "Seguimiento",
  auto_closed: "Cerrada automáticamente",
};

const buildContextChips = (conversation) => {
  const ctx = conversation?.context_data || {};
  const chips = [];

  if (ctx.area) chips.push(ctx.area);
  if (ctx.tipo_automatizacion) chips.push(ctx.tipo_automatizacion);
  if (ctx.tipo_automatizacion_otro) chips.push(ctx.tipo_automatizacion_otro);
  if (ctx.modo_contacto === "whatsapp") chips.push("WhatsApp");
  if (ctx.modo_contacto === "videollamada") chips.push("Videollamada");
  if (ctx.modo_contacto === "email" && ctx.email) chips.push(`Email: ${ctx.email}`);
  if (ctx.budget_details) chips.push("Pidió presupuesto");

  return chips;
};

export default function ChatHeader({
  conversation,
  session,
  updating,
  updateError,
  onAssignToMe,
  onUnassign,
  onChangeStatus,
  onSaveContact,
}) {
  if (!conversation) return null;

  const userId = session?.user?.id || null;
  const isAssignedToMe = conversation.assigned_agent === userId;
  const isUnassigned = !conversation.assigned_agent;
  const canEdit = !!userId && (isAssignedToMe || isUnassigned);

  // Estados locales para edición
  const [editName, setEditName] = useState(conversation.contact_name || "");
  const [editTopic, setEditTopic] = useState(conversation.topic || "");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setEditName(conversation.contact_name || "");
    setEditTopic(conversation.topic || "");
    setDirty(false);
  }, [conversation.id, conversation.contact_name, conversation.topic]);

  const handleStatusClick = (status) => {
    if (!canEdit || !onChangeStatus) return;
    onChangeStatus(status);
  };

  const handleSaveContactInfo = () => {
    if (!canEdit || !onSaveContact || !dirty) return;
    onSaveContact(editName.trim() || null, editTopic.trim() || null);
    setDirty(false);
  };

  const contextState = conversation.context_state || null;
  const contextStateLabel = (contextState && CONTEXT_STATE_LABELS[contextState]) || contextState;
  const contextChips = buildContextChips(conversation);

  return (
    <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm z-20">
      
      {/* 1. Fila Superior: Info Contacto y Acciones de Asignación */}
      <div className="flex items-start justify-between mb-4">
         <div className="flex items-center gap-4">
            {/* Avatar Placeholder */}
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
               <Icon name="User" size={24} />
            </div>
            
            <div className="min-w-0">
               <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => { setEditName(e.target.value); setDirty(true); }}
                    placeholder={conversation.contact_phone}
                    disabled={!canEdit || updating}
                    className="font-bold text-lg text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors w-48 truncate placeholder:text-slate-800"
                  />
                  {dirty && (
                     <button 
                       onClick={handleSaveContactInfo} 
                       className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded animate-in fade-in"
                       title="Save changes"
                     >
                        Save
                     </button>
                  )}
               </div>
               <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Icon name="Phone" size={10} /> {conversation.contact_phone}
               </p>
            </div>
         </div>

         {/* Botonera de Asignación */}
         <div className="flex items-center gap-2">
            {isUnassigned ? (
               <button 
                 onClick={onAssignToMe} disabled={!userId || updating}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-all shadow-sm"
               >
                 <Icon name="UserPlus" size={14} /> Take It
               </button>
            ) : isAssignedToMe ? (
               <button 
                 onClick={onUnassign} disabled={updating}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-medium transition-all"
               >
                 <Icon name="UserMinus" size={14} /> Release
               </button>
            ) : (
               <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center gap-1">
                  <Icon name="Lock" size={12} /> Assigned to other
               </span>
            )}
         </div>
      </div>

      {/* 2. Fila Inferior: Notas y Estados */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
         
         {/* Campo de Notas (Editable) */}
         <div className="flex-1 flex items-center gap-2 px-2 md:border-r md:border-slate-200 md:mr-2">
            <Icon name="FileText" size={14} className="text-slate-400 shrink-0" />
            <input
               type="text"
               value={editTopic}
               onChange={(e) => { setEditTopic(e.target.value); setDirty(true); }}
               placeholder="Add a topic or note..."
               disabled={!canEdit || updating}
               className="w-full bg-transparent text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none"
            />
         </div>

         {/* Botones de Estado */}
         <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {["new", "open", "pending", "closed"].map((status) => {
               const isActive = conversation.status === status;
               const label = STATUS_LABELS[status];
               const activeColor = STATUS_COLORS[status];

               return (
                  <button
                    key={status}
                    onClick={() => handleStatusClick(status)}
                    disabled={!canEdit || updating}
                    className={clsx(
                       "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all border shrink-0",
                       isActive 
                         ? activeColor 
                         : "bg-white border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600",
                       (!canEdit || updating) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {label}
                  </button>
               );
            })}
         </div>
      </div>

      {/* 3. Contexto (Chips) - Solo si hay data */}
      {(contextStateLabel || contextChips.length > 0) && (
         <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 border-dashed">
            {contextStateLabel && (
               <span className="text-[10px] text-slate-400 flex items-center gap-1 mr-2">
                  <Icon name="GitBranch" size={12} /> {contextStateLabel}
               </span>
            )}
            {contextChips.map((chip, idx) => (
               <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-medium border border-indigo-100">
                  <Icon name="Tag" size={10} /> {chip}
               </span>
            ))}
         </div>
      )}

      {/* Mensaje de Error (si falla update) */}
      {updateError && (
         <p className="text-xs text-red-500 mt-2 text-right flex items-center justify-end gap-1">
            <Icon name="AlertCircle" size={12} /> {updateError}
         </p>
      )}
    </div>
  );
}