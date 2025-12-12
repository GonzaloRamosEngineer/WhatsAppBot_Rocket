// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\ChatMessages.jsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import Icon from "../../../components/AppIcon";
import MessageBubble from "./MessageBubble"; // Importamos el componente estilizado

export default function ChatMessages({ messages, loading, error }) {
  const containerRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // --- LÓGICA DE SCROLL (INTACTA) ---
  const scrollToBottom = (behavior = "smooth") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useEffect(() => {
    if (messages?.length > 0) {
      scrollToBottom();
    }
  }, [messages?.length]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollToBottom(distanceFromBottom > 150);
  }, []);

  // --- RENDERIZADO VISUAL ---
  return (
    <div className="flex-1 min-h-0 relative bg-[#F0F2F5]"> {/* Fondo base */}
      
      {/* Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto px-4 md:px-8 py-6 space-y-2 scroll-smooth custom-scrollbar"
      >
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <Icon name="Loader2" size={24} className="animate-spin" />
            <span className="text-xs font-medium">Loading history...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-red-500">
            <Icon name="AlertTriangle" size={24} />
            <span className="text-xs font-medium bg-red-50 px-3 py-1 rounded-full border border-red-100">
               {String(error)}
            </span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && (!messages || messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
               <Icon name="MessageSquare" size={32} className="text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-600">No messages yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
               This is the start of your conversation history.
            </p>
            <div className="mt-4 text-[10px] bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg border border-yellow-100">
               <Icon name="Lock" size={10} className="inline mr-1 mb-0.5" />
               Messages are end-to-end encrypted by WhatsApp.
            </div>
          </div>
        )}

        {/* Lista de Mensajes */}
        {messages && messages.map((msg) => (
           <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Botón Flotante "Ir abajo" (Estilizado) */}
      {showScrollToBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute right-6 bottom-6 w-10 h-10 bg-white text-slate-600 rounded-full shadow-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all hover:scale-110 active:scale-95 z-20"
          title="Scroll to bottom"
        >
          <Icon name="ChevronDown" size={20} />
          {/* Badge de 'Nuevo' opcional */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}
    </div>
  );
}