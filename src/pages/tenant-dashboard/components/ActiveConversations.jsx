// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-dashboard\components\ActiveConversations.jsx

import React from "react";
import Icon from "../../../components/AppIcon";

const ActiveConversations = ({ conversations = [], isLoading = false }) => {
  
  // Helper para tiempo relativo bonito
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "No activity";
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 border-green-200";
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "resolved": return "bg-slate-100 text-slate-600 border-slate-200";
      default: return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-full"> {/* h-full agregado */}
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Active Conversations</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-slate-100 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-3/4" />
                <div className="h-2 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-full flex flex-col"> {/* h-full y flex-col */}
      
      {/* Header Fijo */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Conversations</h3>
        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
          {conversations.length}
        </span>
      </div>

      {/* Lista Scrolleable (ocupa el espacio restante) */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar min-h-[300px]">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-60 h-full">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
               <Icon name="MessageSquareOff" size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No active threads</p>
            <p className="text-xs text-slate-400 max-w-[180px] mt-1">New messages will appear here automatically.</p>
          </div>
        ) : (
          conversations.map((conv) => {
             // Generar inicial
             const initial = (conv.name || "?").charAt(0).toUpperCase();
             
             return (
              <div
                key={conv.id}
                className="group flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100 relative"
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shadow-sm">
                     {initial}
                  </div>
                  {/* Status Dot */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${conv.status === 'active' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="text-sm font-bold text-slate-700 truncate">{conv.name}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{formatLastSeen(conv.lastSeen)}</span>
                  </div>
                  
                  <p className="text-xs text-slate-500 truncate group-hover:text-slate-700 transition-colors">
                    {conv.lastMessage}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                     <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${getStatusStyle(conv.status)}`}>
                        {conv.status}
                     </span>
                     {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                           {conv.unreadCount} new
                        </span>
                     )}
                  </div>
                </div>
                
                {/* Arrow Icon on Hover (Desktop) */}
                <div className="hidden md:block opacity-0 group-hover:opacity-100 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-opacity">
                   <Icon name="ChevronRight" size={16} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Fijo (Si hay datos) */}
      {conversations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 text-center shrink-0">
          <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center justify-center gap-1 mx-auto">
             View All Messages <Icon name="ArrowRight" size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ActiveConversations;