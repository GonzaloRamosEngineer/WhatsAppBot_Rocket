// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ChatHeader.jsx

import React, { useEffect, useState } from "react";
import clsx from "clsx";

const STATUS_LABELS = {
  new: "Nueva",
  open: "Abierta",
  pending: "Pendiente agente",
  closed: "Cerrada",
};

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  open: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  closed:
    "bg-slate-200 text-slate-800 dark:bg-slate-800/60 dark:text-slate-100",
};

// Mapeo de context_state -> label más friendly
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
  auto_closed: "Cerrada automáticamente por inactividad",
};

// Chips con info clave del contexto
const buildContextChips = (conversation) => {
  const ctx = conversation?.context_data || {};
  const chips = [];

  if (ctx.area) chips.push(ctx.area);
  if (ctx.tipo_automatizacion) chips.push(ctx.tipo_automatizacion);
  if (ctx.tipo_automatizacion_otro)
    chips.push(ctx.tipo_automatizacion_otro);

  if (ctx.modo_contacto === "whatsapp") chips.push("Contacto: WhatsApp");
  if (ctx.modo_contacto === "videollamada")
    chips.push("Contacto: videollamada");
  if (ctx.modo_contacto === "email" && ctx.email)
    chips.push(`Email: ${ctx.email}`);

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

  // 🧾 Edición de nombre y nota
  const [editName, setEditName] = useState(conversation.contact_name || "");
  const [editTopic, setEditTopic] = useState(conversation.topic || "");
  const [dirty, setDirty] = useState(false);

  // Sincronizar cuando cambia la conversación seleccionada
  useEffect(() => {
    setEditName(conversation.contact_name || "");
    setEditTopic(conversation.topic || "");
    setDirty(false);
  }, [conversation.id, conversation.contact_name, conversation.topic]);

  const handleStatusClick = (status) => {
    if (!canEdit) return;
    if (!onChangeStatus) return;
    onChangeStatus(status);
  };

  const handleSaveContactInfo = () => {
    if (!canEdit || !onSaveContact || !dirty) return;

    onSaveContact(editName.trim() || null, editTopic.trim() || null);
    setDirty(false);
  };

  const displayName =
    editName.trim() || conversation.contact_name || conversation.contact_phone;

  const contextState = conversation.context_state || null;
  const contextStateLabel =
    (contextState && CONTEXT_STATE_LABELS[contextState]) || contextState;
  const contextChips = buildContextChips(conversation);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/70 backdrop-blur-sm">
      {/* Info del contacto y estado */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* Nombre / teléfono */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  setDirty(true);
                }}
                placeholder={
                  conversation.contact_phone || "Nombre del contacto"
                }
                disabled={!canEdit || updating}
                className="text-sm font-semibold text-foreground bg-transparent border border-transparent focus:border-input rounded px-1 py-0.5 focus:outline-none focus:ring-0 truncate"
              />
            </div>
            <span className="text-[11px] text-muted-foreground truncate">
              {conversation.contact_phone}
            </span>
          </div>
        </div>

        {/* Nota / motivo + estado/asignación */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Nota / motivo */}
          <div className="flex items-center gap-1 flex-1 min-w-[160px]">
            <span className="text-[11px] text-muted-foreground shrink-0">
              Nota:
            </span>
            <input
              type="text"
              value={editTopic}
              onChange={(e) => {
                setEditTopic(e.target.value);
                setDirty(true);
              }}
              placeholder="Ej: Consulta por automatizar negocio"
              disabled={!canEdit || updating}
              className="flex-1 text-[11px] bg-transparent border border-transparent focus:border-input rounded px-1 py-0.5 focus:outline-none focus:ring-0 truncate"
            />
          </div>

          {/* Estado */}
          <span
            className={clsx(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              STATUS_COLORS[conversation.status] ||
                "bg-slate-200 text-slate-800 dark:bg-slate-800/60 dark:text-slate-100"
            )}
          >
            {STATUS_LABELS[conversation.status] || conversation.status}
          </span>

          {/* Asignación */}
          <span className="text-[11px] text-muted-foreground">
            {isUnassigned
              ? "Sin asignar"
              : isAssignedToMe
              ? "Asignada a vos"
              : "Asignada a otro agente"}
          </span>

          {updating && (
            <span className="text-[11px] text-muted-foreground italic">
              Actualizando...
            </span>
          )}

          {updateError && (
            <span className="text-[11px] text-destructive">
              {updateError}
            </span>
          )}
        </div>

        {/* Contexto del flujo */}
        {(contextStateLabel || contextChips.length > 0) && (
          <div className="mt-1 flex flex-col gap-1">
            {contextStateLabel && (
              <p className="text-[11px] text-muted-foreground">
                Contexto actual:{" "}
                <span className="font-medium text-foreground">
                  {contextStateLabel}
                </span>
              </p>
            )}

            {contextChips.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {contextChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 ml-4">
        {/* Guardar nombre/nota */}
        <button
          type="button"
          onClick={handleSaveContactInfo}
          disabled={!canEdit || updating || !dirty}
          className={clsx(
            "text-xs px-2.5 py-1 rounded-md border transition-colors",
            dirty
              ? "border-primary text-primary hover:bg-primary/10"
              : "border-border text-muted-foreground opacity-60 cursor-default"
          )}
        >
          Guardar contacto
        </button>

        {/* Asignar / liberar */}
        {isUnassigned ? (
          <button
            type="button"
            onClick={onAssignToMe}
            disabled={!userId || updating}
            className="text-xs px-2.5 py-1 rounded-md border border-emerald-500 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50"
          >
            Tomar conversación
          </button>
        ) : isAssignedToMe ? (
          <button
            type="button"
            onClick={onUnassign}
            disabled={updating}
            className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted disabled:opacity-50"
          >
            Liberar
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground opacity-60"
          >
            Asignada
          </button>
        )}

        {/* Estados rápidos */}
        <div className="flex items-center gap-1 ml-2">
          {["new", "open", "pending", "closed"].map((status) => {
            const isActive = conversation.status === status;
            const label = STATUS_LABELS[status] || status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusClick(status)}
                disabled={!canEdit || updating}
                className={clsx(
                  "text-[11px] px-2 py-1 rounded-md border transition-colors",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                  (!canEdit || updating) && "opacity-50 cursor-not-allowed"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
