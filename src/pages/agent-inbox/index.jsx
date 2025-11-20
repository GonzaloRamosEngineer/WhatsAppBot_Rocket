// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\index.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../lib/AuthProvider";
import NavigationSidebar from "../../components/ui/NavigationSidebar";

import ConversationList from "./components/ConversationList";
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import MessageComposer from "./components/MessageComposer";

export default function AgentInboxPage() {
  const navigate = useNavigate();

  // ProtectedRoute ya maneja loading; acá no bloqueamos render
  const { supabase, tenant, profile, session, loading: authLoading } =
    useAuth();

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  // Estado para updates de conversación (status / asignación / contacto)
  const [updatingConversation, setUpdatingConversation] = useState(false);
  const [updateConversationError, setUpdateConversationError] =
    useState(null);

  // 🔁 Cargar lista de conversaciones del tenant
  const loadConversations = useCallback(async () => {
    if (!tenant?.id) return;

    setConversationsLoading(true);
    setConversationsError(null);

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        tenant_id,
        channel_id,
        contact_phone,
        contact_name,
        topic,
        status,
        assigned_agent,
        last_message_at
      `
      )
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
        .select(
          `
          id,
          conversation_id,
          tenant_id,
          channel_id,
          direction,
          sender,
          body,
          meta,
          created_at
        `
        )
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

  // Cargar conversaciones al montar / cuando cambia tenant
  useEffect(() => {
    if (!authLoading && tenant?.id) {
      loadConversations();
    }
  }, [authLoading, tenant?.id, loadConversations]);

  // Cuando cambia la conversación seleccionada, cargar sus mensajes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, loadMessages]);

  // 📩 Handler para seleccionar conversación desde la lista
  const handleSelectConversation = (conversationId) => {
    const conv = conversations.find((c) => c.id === conversationId) || null;
    setSelectedConversation(conv);
  };

  // ✉️ Handler para enviar mensaje como agente
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
        const inserted = data?.message;

        const newMessage = inserted || {
          id:
            (crypto.randomUUID && crypto.randomUUID()) ||
            `temp-${Date.now().toString()}`,
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
        // Refrescamos lista para actualizar last_message_at
        loadConversations();
      }
    } catch (e) {
      console.error("[AgentInbox] unexpected send error", e);
      setSendError(e.message || "Unexpected error sending message");
    }

    setSending(false);
  };

  // 🔔 Realtime: escuchar INSERTs en messages del tenant
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

          // Si es de la conversación abierta, lo agregamos al chat
          setMessages((prev) => {
            if (!selectedConversation) return prev;
            if (newMsg.conversation_id !== selectedConversation.id) return prev;
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Actualizar lista de conversaciones (last_message_at y orden)
          setConversations((prev) => {
            const idx = prev.findIndex(
              (c) => c.id === newMsg.conversation_id
            );
            if (idx === -1) return prev;

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
  }, [supabase, tenant?.id, selectedConversation]);

  // 🧩 Helper para aplicar patch a la conversación seleccionada
  const patchSelectedConversation = useCallback(
    async (fields) => {
      if (!selectedConversation?.id) return;

      setUpdatingConversation(true);
      setUpdateConversationError(null);

      const { data, error } = await supabase
        .from("conversations")
        .update(fields)
        .eq("id", selectedConversation.id)
        .select(
          `
          id,
          tenant_id,
          channel_id,
          contact_phone,
          contact_name,
          topic,
          status,
          assigned_agent,
          last_message_at
        `
        )
        .single();

      if (error) {
        console.error("[AgentInbox] patchSelectedConversation error", error);
        setUpdateConversationError(
          error.message || "Error updating conversation"
        );
      } else if (data) {
        // Actualizamos en lista
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === data.id);
          if (idx === -1) return prev;
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        });
        // Actualizamos seleccionada
        setSelectedConversation(data);
      }

      setUpdatingConversation(false);
    },
    [supabase, selectedConversation]
  );

  // 👤 Tomar conversación
  const handleAssignToMe = async () => {
    if (!session?.user?.id || !selectedConversation) return;

    const nextStatus =
      selectedConversation.status === "new"
        ? "open"
        : selectedConversation.status;

    await patchSelectedConversation({
      assigned_agent: session.user.id,
      status: nextStatus,
    });
  };

  // 👤 Liberar conversación
  const handleUnassign = async () => {
    if (!selectedConversation) return;
    await patchSelectedConversation({
      assigned_agent: null,
    });
  };

  // 🔄 Cambiar estado (new | open | pending | closed)
  const handleChangeStatus = async (newStatus) => {
    if (!selectedConversation) return;
    if (newStatus === selectedConversation.status) return;

    await patchSelectedConversation({
      status: newStatus,
    });
  };

  // 📝 Actualizar nombre / nota del contacto
  const handleUpdateContactInfo = async ({ contact_name, topic }) => {
    if (!selectedConversation) return;
    await patchSelectedConversation({
      contact_name: contact_name ?? null,
      topic: topic ?? null,
    });
  };

  const handleBackToDashboard = () => {
    navigate("/tenant-dashboard");
  };

  const noTenant = !tenant?.id;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar global */}
      <NavigationSidebar />

      {/* Contenido principal */}
      <main className="flex-1 ml-0 md:ml-60 flex flex-col">
        {/* Header superior */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/60 backdrop-blur">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              Bandeja de agente
            </span>
            <span className="text-xs text-muted-foreground">
              Conversaciones · {tenant?.name || "DigitalMatch"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleBackToDashboard}
            className="text-xs md:text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted micro-animation"
          >
            Volver al dashboard
          </button>
        </header>

        {/* Contenido del inbox */}
        <section className="flex-1 p-4">
          {noTenant ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              No tenés un tenant asociado todavía. Completá el registro de tu
              organización para usar la bandeja de agente.
            </div>
          ) : (
            <div className="flex h-full border border-border rounded-xl overflow-hidden bg-background">
              {/* Lista de conversaciones */}
              <div className="w-full max-w-xs border-right border-border bg-muted/30 flex flex-col border-r">
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-sm font-semibold">
                    Conversaciones
                    {tenant?.name ? ` · ${tenant.name}` : ""}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Seleccioná un chat para responder como agente.
                  </p>
                </div>

                <ConversationList
                  conversations={conversations}
                  loading={conversationsLoading}
                  error={conversationsError}
                  selectedId={selectedConversation?.id || null}
                  onSelect={handleSelectConversation}
                />
              </div>

              {/* Panel de chat */}
              <div className="flex flex-1 flex-col">
                {selectedConversation ? (
                  <>
                    <ChatHeader
                      conversation={selectedConversation}
                      profile={profile}
                      session={session}
                      updating={updatingConversation}
                      updateError={updateConversationError}
                      onAssignToMe={handleAssignToMe}
                      onUnassign={handleUnassign}
                      onChangeStatus={handleChangeStatus}
                      onUpdateContactInfo={handleUpdateContactInfo}
                    />

                    <ChatMessages
                      messages={messages}
                      loading={messagesLoading}
                      error={messagesError}
                    />

                    <div className="border-t border-border">
                      <MessageComposer
                        disabled={
                          sending || selectedConversation.status === "closed"
                        }
                        onSend={handleSendMessage}
                        error={sendError}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center text-sm text-muted-foreground">
                    <p className="mb-2 font-medium">
                      No hay conversación seleccionada
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Elegí un contacto de la lista para ver el historial y
                      responder.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
