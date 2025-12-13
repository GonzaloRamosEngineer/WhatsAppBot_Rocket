// C:\Projects\WhatsAppBot_Rocket\src\pages\messages-log\index.jsx

import React, { useMemo, useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom"; // CONEXIÓN CON LAYOUT
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import MessageFilters from "./components/MessageFilters";
import MessageTable from "./components/MessageTable";
import ConversationSummary from "./components/ConversationSummary";
import MessageStats from "./components/MessageStats";
import Button from "../../components/ui/Button";
import { useAuth } from "@/lib/AuthProvider";
import Icon from "../../components/AppIcon";

const MessagesLog = () => {
  const { profile, tenant, supabase, logout } = useAuth();
  
  // 👇 1. Contexto del Layout
  const { toggleMobileMenu } = useOutletContext();
  
  // Estado de Datos (Lógica Intacta)
  const [localMessages, setLocalMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Estado de Filtros (Lógica Intacta)
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedConversation, setSelectedConversation] = useState(null);

  // --- CARGAR MENSAJES (Lógica Intacta) ---
  useEffect(() => {
    if (!supabase || !tenant?.id) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      setLoadError(null);

      try {
        const { data, error } = await supabase
          .from("messages")
          .select(`
            id,
            body,
            direction,
            created_at,
            meta,
            conversation_id,
            conversations ( contact_phone )
          `) 
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) throw error;

        // Adaptamos datos crudos de DB a nuestra UI
        const adapted = (data || []).map((m) => {
          const meta = m.meta || {};
          const isInbound = m.direction === "in" || m.direction === "inbound";
          
          const contactPhone = m.conversations?.contact_phone || meta.from || meta.to || "Unknown";
          const contactName = meta.contactName || meta.profile_name || contactPhone;

          const finalStatus = 
            meta.status || 
            meta.delivery_status || 
            (isInbound ? "received" : "sent");

          return {
            id: m.id,
            messageId: meta.message_id || meta.wamid || m.id,
            contact: contactPhone,
            contactName: contactName,
            body: m.body || "",
            direction: isInbound ? "inbound" : "outbound",
            status: finalStatus,
            timestamp: m.created_at,
            meta: meta, 
          };
        });

        setLocalMessages(adapted);
      } catch (e) {
        console.error("Error loading messages:", e);
        setLoadError(e.message);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
    
  }, [supabase, tenant?.id]);

  // --- CÁLCULO DE STATS (Lógica Intacta) ---
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      totalMessages: localMessages.length,
      sentToday: localMessages.filter(m => m.direction === 'outbound' && new Date(m.timestamp).toDateString() === today).length,
      receivedToday: localMessages.filter(m => m.direction === 'inbound' && new Date(m.timestamp).toDateString() === today).length,
      failedMessages: localMessages.filter(m => m.status === 'failed').length
    };
  }, [localMessages]);

  // --- FILTRADO (Lógica Intacta) ---
  const filteredMessages = useMemo(() => {
    return localMessages.filter(m => {
      if (activeFilters.dateFrom && new Date(m.timestamp) < new Date(activeFilters.dateFrom)) return false;
      if (activeFilters.dateTo && new Date(m.timestamp) > new Date(activeFilters.dateTo)) return false;
      
      if (activeFilters.contact) {
        const term = activeFilters.contact.toLowerCase();
        if (!m.contact.toLowerCase().includes(term) && !m.contactName.toLowerCase().includes(term)) return false;
      }

      if (activeFilters.status && m.status !== activeFilters.status) return false;

      if (activeFilters.keyword && !m.body.toLowerCase().includes(activeFilters.keyword.toLowerCase())) return false;

      if (selectedConversation && m.contact !== selectedConversation.contact) return false;

      return true;
    });
  }, [localMessages, activeFilters, selectedConversation]);

  // --- AGRUPAR CONVERSACIONES (Lógica Intacta) ---
  const conversations = useMemo(() => {
    const map = new Map();
    localMessages.forEach(m => {
      if (!map.has(m.contact)) {
        map.set(m.contact, {
          id: m.contact,
          contact: m.contact,
          contactName: m.contactName,
          lastMessage: m.body,
          lastMessageTime: m.timestamp,
          messageCount: 0
        });
      }
      const conv = map.get(m.contact);
      conv.messageCount++;
      
      if (new Date(m.timestamp) > new Date(conv.lastMessageTime)) {
        conv.lastMessage = m.body;
        conv.lastMessageTime = m.timestamp;
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
  }, [localMessages]);

  const handleLogout = async () => { await logout(); };

  // --- RENDER REFACTORIZADO (Layout Pattern) ---
  return (
    <div className="h-full overflow-y-auto bg-slate-50 animate-fade-in">
      
      {/* Header Unificado & Responsive */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 sticky top-0 z-20 shadow-sm transition-all">
        <div className="flex items-center justify-between">
          
          {/* IZQUIERDA: Menú + Título */}
          <div className="flex items-center gap-3">
             {/* Botón Menú (Solo Móvil - Estilo Violáceo) */}
             <button 
               onClick={toggleMobileMenu}
               className="md:hidden p-2 mr-1 text-indigo-600 bg-white border border-indigo-100 rounded-lg shadow-sm hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md transition-all active:scale-95"
             >
               <Icon name="Menu" size={20} />
             </button>

             <div className="hidden md:block bg-slate-700 p-2 rounded-lg text-white shadow-sm">
                <Icon name="List" size={20} />
             </div>
             <div>
                <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-tight">Messages Logs</h1>
                <p className="text-slate-500 text-xs font-medium hidden md:block">
                  Audit trail of all communication history
                </p>
             </div>
          </div>

          {/* DERECHA: Acciones + Perfil */}
          <div className="flex items-center gap-3">
             {/* Botón Refresh (Icono solo en móvil) */}
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => window.location.reload()} 
               className="text-slate-500 border-slate-200 hover:bg-slate-50"
               title="Refresh Data"
             >
               <Icon name="RefreshCw" size={16} className={loadingMessages ? "animate-spin" : ""} />
               <span className="hidden md:inline ml-2">Refresh</span>
             </Button>
             
             <UserProfileDropdown user={{ name: tenant?.name || "User", role: profile?.role }} onLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* Contenido Principal (Sin márgenes extra) */}
      <main className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
        {/* Stats Cards */}
        <MessageStats stats={stats} />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            <MessageFilters onFilterChange={setActiveFilters} onExport={() => console.log("Export triggered")} />
            
            {loadError ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center gap-2">
                 <Icon name="AlertTriangle" /> Error loading data: {loadError}
              </div>
            ) : (
              <MessageTable 
                 messages={filteredMessages} 
                 loading={loadingMessages}
                 onBulkAction={(action, ids) => console.log(action, ids)} 
              />
            )}
          </div>

          {/* Sidebar Resumen */}
          <div className="xl:col-span-1">
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-28">
                <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700">
                  Active Conversations
                </div>
                <ConversationSummary 
                  conversations={conversations} 
                  onSelectConversation={setSelectedConversation} 
                />
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesLog;