// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\index.jsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom"; // IMPORTANTE: useOutletContext

import { useAuth } from "../../lib/AuthProvider";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import Icon from "../../components/AppIcon";

import ConversationList from "./components/ConversationList";
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import MessageComposer from "./components/MessageComposer";

export default function AgentInboxPage() {
  const navigate = useNavigate();
  
  // 👇 1. Conexión con el Layout para menú móvil
  const { toggleMobileMenu } = useOutletContext();

  // --- LÓGICA ORIGINAL (INTACTA) ---
  const { supabase, tenant, profile, session, loading: authLoading, logout } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const [updatingConversation, setUpdatingConversation] = useState(false);
  const [updateConversationError, setUpdateConversationError] = useState(null);
  
  // (Eliminado estado local sidebarCollapsed)

  // 🔁 Cargar lista de conversaciones del tenant
  const loadConversations = useCallback(async () => {
    if (!tenant?.id) return;

    setConversationsLoading(true);
    setConversationsError(null);

    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        tenant_id,
        channel_id,
        contact_phone,
        contact_name,
        topic,
        status,
        assigned_agent,
        last_message_at,
        context_state,
        context_data
      `)
      .eq("tenant_id", tenant.id)
      .in("status", ["new", "open", "pending", "closed"])
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("[AgentInbox] loadConversations error", error);
      setConversationsError(error.message || "Error loading conversations");
      setConversations([]);
    } else {
      setConversations(data || []);
    }

    setConversationsLoading(false);
  }, [supabase, tenant?.id]);

  // 🔁 Cargar mensajes de una conversación
  const loadMessages = useCallback(
    async (conversation) => {
      if (!conversation?.id) return;

      setMessagesLoading(true);
      setMessagesError(null);

      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          conversation_id,
          tenant_id,
          channel_id,
          direction,
          sender,
          body,
          meta,
          created_at
        `)
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[AgentInbox] loadMessages error", error);
        setMessagesError(error.message || "Error loading messages");
        setMessages([]);
      } else {
        setMessages(data || []);
      }

      setMessagesLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (!authLoading && tenant?.id) {
      loadConversations();
    }
  }, [authLoading, tenant?.id, loadConversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, loadMessages]);

  const handleSelectConversation = (conversationId) => {
    const conv = conversations.find((c) => c.id === conversationId) || null;
    setSelectedConversation(conv);
  };

  // Botón "Atrás" para móvil
  const handleBackToList = () => {
    setSelectedConversation(null);
  };

const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    if (!selectedConversation) return;
    if (!tenant?.id) return;

    setSending(true);
    setSendError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "whatsapp-send-message",
        {
          body: {
            conversationId: selectedConversation.id,
            text,
          },
        }
      );

      if (error) {
        console.error("[AgentInbox] send message error", error);
        setSendError(error.message || "Error sending message");
      } else {
        // ✅ CORRECCIÓN AQUI:
        // Comentamos o borramos estas líneas.
        // No agregamos el mensaje manualmente "setMessages(...)".
        // Esperamos a que el useEffect del realtime lo reciba y lo pinte.
        
        /* const inserted = data?.message;
        const newMessage = inserted || {
          id: (crypto.randomUUID && crypto.randomUUID()) || `temp-${Date.now().toString()}`,
          conversation_id: selectedConversation.id,
          tenant_id: tenant.id,
          channel_id: selectedConversation.channel_id,
          direction: "out",
          sender: session?.user?.id ?? "agent",
          body: text,
          meta: { via: "agent" },
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMessage]); 
        */

        // Mantenemos esto para que la lista lateral (sidebar) suba la conversación al tope
        loadConversations();
      }
    } catch (e) {
      console.error("[AgentInbox] unexpected send error", e);
      setSendError(e.message || "Unexpected error sending message");
    }

    setSending(false);
  };

  // 🔔 Realtime
  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel(`realtime-messages-tenant-${tenant.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          const newMsg = payload.new;
          if (!newMsg) return;

          setMessages((prev) => {
            if (!selectedConversation) return prev;
            if (newMsg.conversation_id !== selectedConversation.id) return prev;
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === newMsg.conversation_id);
            if (idx === -1) {
                // Si es nuevo, recargamos la lista completa para asegurarnos
                loadConversations();
                return prev; 
            }

            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              last_message_at: newMsg.created_at,
            };

            updated.sort((a, b) => {
              const da = new Date(a.last_message_at || 0).getTime();
              const db = new Date(b.last_message_at || 0).getTime();
              return db - da;
            });

            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, tenant?.id, selectedConversation, loadConversations]);

  // 🧩 Helpers de lógica de negocio (INTACTOS)
  const patchSelectedConversation = useCallback(
    async (fields) => {
      if (!selectedConversation?.id) return;

      setUpdatingConversation(true);
      setUpdateConversationError(null);

      const { data, error } = await supabase
        .from("conversations")
        .update(fields)
        .eq("id", selectedConversation.id)
        .select().single();

      if (error) {
        console.error("[AgentInbox] patchSelectedConversation error", error);
        setUpdateConversationError(error.message || "Error updating conversation");
      } else if (data) {
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === data.id);
          if (idx === -1) return prev;
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        });
        setSelectedConversation(data);
      }

      setUpdatingConversation(false);
    },
    [supabase, selectedConversation]
  );

  const handleAssignToMe = async () => {
    if (!session?.user?.id || !selectedConversation) return;
    const nextStatus = selectedConversation.status === "new" ? "open" : selectedConversation.status;
    await patchSelectedConversation({ assigned_agent: session.user.id, status: nextStatus });
  };

  const handleUnassign = async () => {
    if (!selectedConversation) return;
    await patchSelectedConversation({ assigned_agent: null });
  };

  const handleChangeStatus = async (newStatus) => {
    if (!selectedConversation || newStatus === selectedConversation.status) return;
    await patchSelectedConversation({ status: newStatus });
  };

  const handleSaveContact = async (contactName, topic) => {
    if (!selectedConversation) return;
    await patchSelectedConversation({ contact_name: contactName, topic: topic });
  };

  const handleDeleteConversation = async (conversationId) => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    if (!window.confirm(`Delete conversation with ${conv.contact_name || conv.contact_phone}?`)) return;

    try {
      const { error: msgError } = await supabase.from("messages").delete().eq("conversation_id", conversationId);
      if (msgError) throw msgError;

      const { error: convError } = await supabase.from("conversations").delete().eq("id", conversationId);
      if (convError) throw convError;

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (e) {
      console.error("[AgentInbox] delete error", e);
      alert("Error deleting conversation.");
    }
  };

  const handleLogout = async () => { await logout(); };

  // --- RENDER REFACTORIZADO (Layout Pattern) ---
  return (
    // Se elimina el contenedor con márgenes dinámicos y el Sidebar
    // Ocupamos todo el alto disponible del layout padre
    <div className="flex flex-col h-full bg-slate-50 relative">
      
        {/* HEADER UNIFICADO */}
        {/* Oculto en móvil si hay chat seleccionado para maximizar espacio */}
        <header className={`bg-white border-b border-slate-200 px-4 md:px-6 py-3 shrink-0 z-20 shadow-sm flex items-center justify-between ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            
            {/* IZQUIERDA: Menú + Icono + Título */}
            <div className="flex items-center gap-3">
               
               {/* Botón Menú (Solo Móvil) - Llama al Layout */}
               <button 
                 onClick={toggleMobileMenu}
                 className="md:hidden p-2 mr-1 text-indigo-600 bg-white border border-indigo-100 rounded-lg shadow-sm hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md transition-all active:scale-95"
                 title="Toggle Menu"
               >
                 <Icon name="Menu" size={20} />
               </button>

               <div className="bg-amber-500 p-2 rounded-lg text-white shadow-md shadow-amber-200 shrink-0">
                  <Icon name="Headphones" size={20} />
               </div>
               <div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Agent Inbox</h1>
                  <p className="text-slate-500 text-xs font-medium hidden md:block">
                    Live Chat · {tenant?.name || "Workspace"}
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-600">Online</span>
                </div>
                <UserProfileDropdown user={{ name: tenant?.name, role: profile?.role }} onLogout={handleLogout} />
            </div>
        </header>

        {/* LAYOUT PRINCIPAL */}
        <section className="flex-1 flex overflow-hidden relative">
          
          {/* 1. LISTA DE CONVERSACIONES */}
          <aside className={`
             bg-white border-r border-slate-200 flex-col shrink-0 z-10 transition-all
             ${selectedConversation ? 'hidden md:flex md:w-80' : 'flex w-full md:w-80'}
          `}>
             <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                   Active ({conversations.length})
                </h2>
             </div>

             <div className="flex-1 overflow-y-auto">
                <ConversationList
                  conversations={conversations}
                  loading={conversationsLoading}
                  error={conversationsError}
                  selectedId={selectedConversation?.id || null}
                  onSelect={handleSelectConversation}
                  onDeleteConversation={handleDeleteConversation}
                />
             </div>
          </aside>

          {/* 2. CHAT ACTIVO */}
          <main className={`
             flex-col min-w-0 bg-[#F0F2F5] relative transition-all
             ${selectedConversation ? 'flex w-full md:flex-1' : 'hidden md:flex md:flex-1'}
          `}>
             {/* Fondo WhatsApp Style */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                  style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
             </div>

             {selectedConversation ? (
               <>
                 {/* Header del Chat con botón "Atrás" para móvil */}
                 <div className="z-10 shadow-sm relative bg-white border-b border-slate-200">
                    <div className="flex items-center">
                        {/* Botón Volver (Solo Móvil) */}
                        <div className="md:hidden pl-2">
                            <button 
                              onClick={handleBackToList}
                              className="p-2 hover:bg-slate-100 rounded-full text-slate-600"
                            >
                               <Icon name="ArrowLeft" size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <ChatHeader
                              conversation={selectedConversation}
                              profile={profile}
                              session={session}
                              updating={updatingConversation}
                              updateError={updateConversationError}
                              onAssignToMe={handleAssignToMe}
                              onUnassign={handleUnassign}
                              onChangeStatus={handleChangeStatus}
                              onSaveContact={handleSaveContact}
                            />
                        </div>
                    </div>
                 </div>

                 {/* Mensajes */}
                 <div className="flex-1 overflow-y-auto relative z-0 p-4">
                    <ChatMessages
                      messages={messages}
                      loading={messagesLoading}
                      error={messagesError}
                    />
                 </div>

                 {/* Composer */}
                 <div className="p-3 md:p-4 bg-white border-t border-slate-200 z-10">
                    <MessageComposer
                      disabled={sending || selectedConversation.status === "closed"}
                      onSend={handleSendMessage}
                      error={sendError}
                    />
                 </div>
               </>
             ) : (
               // Estado Vacío (Desktop)
               <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <Icon name="MessageSquare" size={48} className="text-slate-300" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-600 mb-2">Ready to chat?</h2>
                  <p className="max-w-xs text-center text-sm text-slate-500">
                    Select a conversation from the sidebar to start messaging your customers.
                  </p>
               </div>
             )}
          </main>

        </section>
    </div>
  );
}