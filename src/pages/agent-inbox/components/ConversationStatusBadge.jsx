// src/pages/agent-inbox/components/ConversationStatusBadge.jsx
import React from "react";

export default function ConversationStatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
        Sin estado
      </span>
    );
  }

  const normalized = status.toLowerCase();

  let classes =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ";
  let label = status;

  if (normalized === "pending_agent" || normalized === "pending") {
    classes += "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100";
    label = "Pendiente agente";
  } else if (normalized === "open") {
    classes += "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100";
    label = "Abierta";
  } else if (normalized === "closed") {
    classes += "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
    label = "Cerrada";
  } else if (normalized === "new") {
    classes += "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100";
    label = "Nueva";
  } else {
    classes += "bg-muted text-muted-foreground";
    label = status;
  }

  return <span className={classes}>{label}</span>;
}
