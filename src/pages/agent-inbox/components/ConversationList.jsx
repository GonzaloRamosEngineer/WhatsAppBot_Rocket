// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ConversationList.jsx

import React, { useMemo, useState } from "react";
import ConversationListItem from "./ConversationListItem";

export default function ConversationList({
  conversations,
  loading,
  error,
  selectedId,
  onSelect,
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((c) => {
      const name = (c.contact_name || "").toLowerCase();
      const phone = (c.contact_phone || "").toLowerCase();
      const status = (c.status || "").toLowerCase();
      const topic = (c.topic || "").toLowerCase();
      return (
        name.includes(term) ||
        phone.includes(term) ||
        status.includes(term) ||
        topic.includes(term)
      );
    });
  }, [conversations, search]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Buscador */}
      <div className="p-2 border-b border-border">
        <input
          type="text"
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Buscar por nombre, teléfono o estado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-xs text-muted-foreground">
            Cargando conversaciones...
          </div>
        )}

        {error && !loading && (
          <div className="p-4 text-xs text-red-500">
            Error: {String(error)}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-4 text-xs text-muted-foreground">
            No se encontraron conversaciones.
          </div>
        )}

        <ul className="divide-y divide-border">
          {filtered.map((conv) => (
            <ConversationListItem
              key={conv.id}
              conversation={conv}
              selected={conv.id === selectedId}
              onClick={() => onSelect(conv.id)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
