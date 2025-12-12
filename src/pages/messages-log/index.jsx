// C:\Projects\WhatsAppBot_Rocket\src\pages\messages-log\index.jsx

import React, { useMemo, useState, useEffect } from "react";
import NavigationSidebar from "../../components/ui/NavigationSidebar";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Estado de Datos
  const [localMessages, setLocalMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Estado de Filtros
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedConversation, setSelectedConversation] = useState(null);

  // --- CARGAR MENSAJES ---
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
            status,
            created_at,
            meta,
            conversation_id,
            conversations ( contact_phone )
          `)
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false })
          .limit(500); // Límite seguro para demo

        if (error) throw error;

        // Adaptamos datos crudos de DB a nuestra UI
        const adapted = (data || []).map((m) => {
          const meta = m.meta || {};
          const isInbound = m.direction === "in" || m.direction === "inbound";
          
          // Determinamos el contacto
          const contactPhone = m.conversations?.contact_phone || meta.from || meta.to || "Unknown";
          const contactName = meta.contactName || meta.profile_name || contactPhone;

          // Status fallback
          const finalStatus = m.status || meta.status || "sent";

          return {
            id: m.id,
            messageId: meta.message_id || meta.wamid || m.id,
            contact: contactPhone,
            contactName: contactName,
            body: m.body || "",
            direction: isInbound ? "inbound" : "outbound",
            status: finalStatus,
            timestamp: m.created_at,
            meta: meta, // Guardamos todo el meta para el modal JSON
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
    
    // Aquí podrías agregar una suscripción .on('postgres_changes') para tiempo real
  }, [supabase, tenant?.id]);

  // --- CÁLCULO DE STATS ---
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      totalMessages: localMessages.length,
      sentToday: localMessages.filter(m => m.direction === 'outbound' && new Date(m.timestamp).toDateString() === today).length,
      receivedToday: localMessages.filter(m => m.direction === 'inbound' && new Date(m.timestamp).toDateString() === today).length,
      failedMessages: localMessages.filter(m => m.status === 'failed').length
    };
  }, [localMessages]);

  // --- FILTRADO ---
  const filteredMessages = useMemo(() => {
    return localMessages.filter(m => {
      // Filtro por Fecha
      if (activeFilters.dateFrom && new Date(m.timestamp) < new Date(activeFilters.dateFrom)) return false;
      if (activeFilters.dateTo && new Date(m.timestamp) > new Date(activeFilters.dateTo)) return false;
      
      // Filtro por Contacto
      if (activeFilters.contact) {
        const term = activeFilters.contact.toLowerCase();
        if (!m.contact.toLowerCase().includes(term) && !m.contactName.toLowerCase().includes(term)) return false;
      }

      // Filtro por Status
      if (activeFilters.status && m.status !== activeFilters.status) return false;

      // Filtro por Keyword
      if (activeFilters.keyword && !m.body.toLowerCase().includes(activeFilters.keyword.toLowerCase())) return false;

      // Filtro por Conversación Seleccionada (Summary sidebar)
      if (selectedConversation && m.contact !== selectedConversation.contact) return false;

      return true;
    });
  }, [localMessages, activeFilters, selectedConversation]);

  // --- AGRUPAR CONVERSACIONES (Para Sidebar Derecho) ---
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
      // Actualizamos si este mensaje es más nuevo
      if (new Date(m.timestamp) > new Date(conv.lastMessageTime)) {
        conv.lastMessage = m.body;
        conv.lastMessageTime = m.timestamp;
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
  }, [localMessages]);

  const handleLogout = async () => { await logout(); };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole="tenant"
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-60"}`}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Messages Logs</h1>
              <p className="text-slate-500 text-sm mt-1">Audit trail of all communication via WhatsApp API</p>
            </div>
            <div className="flex items-center gap-3">
               <Button variant="outline" size="sm" onClick={() => window.location.reload()} iconName="RefreshCw">
                 Refresh
               </Button>
               <UserProfileDropdown user={{ name: tenant?.name || "User", role: profile?.role }} onLogout={handleLogout} />
            </div>
          </div>
        </header>

        <main className="p-8 max-w-[1600px] mx-auto">
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
               {/* Asumiendo que ConversationSummary ya existe, lo envolvemos para estilo */}
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
    </div>
  );
};

export default MessagesLog;