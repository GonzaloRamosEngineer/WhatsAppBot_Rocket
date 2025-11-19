// src/pages/agent-inbox/index.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../lib/AuthProvider";
import ConversationList from "./components/ConversationList";
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import MessageComposer from "./components/MessageComposer";

export default function AgentInboxPage() {
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
        status,
        assigned_agent,
        last_message_at
      `
      )
      .eq("tenant_id", tenant.id)
      .in("status", ["open", "pending_agent", "new", "closed"]) // ajustá según tus estados
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

    try:
      // llamamos a la Edge Function nueva
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

        // Mensaje optimista / desde backend
        const newMessage = inserted || {
          id:
            (crypto.randomUUID && crypto.randomUUID()) ||
            `temp-${Date.now().toString()}`,
          conversation_id: selectedConversation.id,
          tenant_id: tenant.id,
          channel_id: selectedConversation.channel_id,
          direction: "out", // 👈 consistente con webhook
          sender: session?.user?.id ?? "agent",
          body: text,
          meta: { via: "agent" },
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);
        loadConversations();
      }
    } catch (e) {
      console.error("[AgentInbox] unexpected send error", e);
      setSendError(e.message || "Unexpected error sending message");
    }

    setSending(false);
  };

  // 📌 Estados de carga globales
  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Cargando sesión...
      </div>
    );
  }

  if (!tenant?.id) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No tenés un tenant asociado todavía.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] border border-border rounded-xl overflow-hidden bg-background">
      {/* Lista de conversaciones */}
      <div className="w-full max-w-xs border-r border-border bg-muted/30 flex flex-col">
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
            />

            <ChatMessages
              messages={messages}
              loading={messagesLoading}
              error={messagesError}
            />

            <div className="border-t border-border">
              <MessageComposer
                disabled={sending}
                onSend={handleSendMessage}
                error={sendError}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-sm text-muted-foreground">
            <p className="mb-2 font-medium">No hay conversación seleccionada</p>
            <p className="text-xs text-muted-foreground">
              Elegí un contacto de la lista para ver el historial y responder.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
