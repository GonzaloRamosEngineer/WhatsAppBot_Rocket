// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ConversationList.jsx

import React from "react";
import ConversationListItem from "./ConversationListItem";

export default function ConversationList({
  conversations,
  loading,
  error,
  selectedId,
  onSelect,
  onDeleteConversation, // 👈 NUEVO
}) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
        Cargando conversaciones...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-destructive px-4 text-center">
        {error}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground px-4 text-center">
        No hay conversaciones todavía. Cuando alguien escriba al WhatsApp de tu
        canal, va a aparecer acá.
      </div>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto divide-y divide-border">
      {conversations.map((conv) => (
        <ConversationListItem
          key={conv.id}
          conversation={conv}
          selected={selectedId === conv.id}
          onClick={() => onSelect(conv.id)}
          onDelete={() =>
            onDeleteConversation && onDeleteConversation(conv.id)
          }
        />
      ))}
    </ul>
  );
}
