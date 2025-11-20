// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ChatHeader.jsx

import React from "react";
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

export default function ChatHeader({
  conversation,
  session,
  updating,
  updateError,
  onAssignToMe,
  onUnassign,
  onChangeStatus,
}) {
  if (!conversation) return null;

  const userId = session?.user?.id || null;
  const isAssignedToMe = conversation.assigned_agent === userId;
  const isUnassigned = !conversation.assigned_agent;

  const canEdit = !!userId && (isAssignedToMe || isUnassigned);

  const handleStatusClick = (status) => {
    if (!canEdit) return;
    if (!onChangeStatus) return;
    onChangeStatus(status);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/70 backdrop-blur-sm">
      {/* Info del contacto y estado */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {conversation.contact_phone || "Contacto sin nombre"}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
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
          </div>

          {updateError && (
            <span className="text-[11px] text-destructive mt-0.5">
              {updateError}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
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
