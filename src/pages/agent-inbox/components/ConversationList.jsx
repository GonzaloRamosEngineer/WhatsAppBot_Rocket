// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ConversationList.jsx

import React from "react";
import ConversationListItem from "./ConversationListItem";
import Icon from "../../../components/AppIcon"; // Importamos para los estados vacíos

export default function ConversationList({
  conversations,
  loading,
  error,
  selectedId,
  onSelect,
  onDeleteConversation, // Mantenemos la prop nueva
}) {
  
  // 1. Estado de Carga
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white">
        <Icon name="Loader2" className="animate-spin text-indigo-500" size={24} />
        <span className="text-xs font-medium text-slate-400">Loading conversations...</span>
      </div>
    );
  }

  // 2. Estado de Error
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-2 bg-white">
        <div className="p-3 bg-red-50 rounded-full text-red-500 mb-2">
           <Icon name="AlertTriangle" size={20} />
        </div>
        <p className="text-xs text-red-600 font-medium max-w-[200px]">
          {error}
        </p>
      </div>
    );
  }

  // 3. Estado Vacío (Sin conversaciones)
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4 bg-white">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
          <Icon name="MessageSquareOff" size={24} className="text-slate-300" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-700">No active chats</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            New messages to your WhatsApp channel will appear here instantly.
          </p>
        </div>
      </div>
    );
  }

  // 4. Lista de Conversaciones (Renderizado principal)
  return (
    <ul className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
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