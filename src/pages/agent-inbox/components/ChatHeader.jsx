// src/pages/agent-inbox/components/ChatHeader.jsx
import React from "react";
import ConversationStatusBadge from "./ConversationStatusBadge";

export default function ChatHeader({ conversation, profile, session }) {
  if (!conversation) return null;

  const phone = conversation.contact_phone || "Sin teléfono";
  const currentUserId = session?.user?.id || null;
  const isAssignedToMe =
    currentUserId && conversation.assigned_agent === currentUserId;

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-muted/40">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{phone}</span>
        <div className="flex items-center gap-2">
          <ConversationStatusBadge status={conversation.status} />
          {isAssignedToMe && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-300">
              Asignada a vos
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Canal WhatsApp</span>
      </div>
    </div>
  );
}
