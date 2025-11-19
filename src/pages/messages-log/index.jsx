import React, { useMemo, useState, useEffect } from "react";
import NavigationSidebar from "../../components/ui/NavigationSidebar";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import MessageFilters from "./components/MessageFilters";
import MessageTable from "./components/MessageTable";
import ConversationSummary from "./components/ConversationSummary";
import MessageStats from "./components/MessageStats";
import Button from "../../components/ui/Button";

// Sesión + Supabase
import { useAuth } from "@/lib/AuthProvider";

const MessagesLog = () => {
  const { profile, tenant, supabase, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Cargar mensajes reales desde Supabase
  useEffect(() => {
    if (!supabase || !tenant?.id) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      setLoadError(null);

      try {
        const { data, error } = await supabase
          .from("messages")
          .select(
            `
            id,
            body,
            direction,
            status,
            created_at,
            meta,
            conversation_id,
            conversations (
              contact_phone
            )
          `
          )
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) {
          console.error("[MessagesLog] error loading messages", error);
          setLoadError(error.message);
          setLocalMessages([]);
          return;
        }

        const adapted = (data || []).map((m) => {
          const meta = m.meta || {};
          const isInbound = m.direction === "in" || m.direction === "inbound";

          const contactFromConv = m.conversations?.contact_phone;

          const contact =
            contactFromConv ||
            (isInbound
              ? meta.from || meta.wa_id || meta.contact
              : meta.to || meta.wa_id || meta.contact) ||
            "+0 000 000 000";

          const contactName =
            meta.contactName ||
            meta.name ||
            meta.profile_name ||
            contact ||
            "Unknown";

          return {
            id: m.id,
            messageId: meta.message_id || meta.id || `msg_${m.id}`,
            contact,
            contactName,
            body: m.body || "",
            direction: isInbound ? "inbound" : "outbound",
            status: m.status || meta.status || "sent",
            timestamp: m.created_at ? new Date(m.created_at) : new Date(),
            metadata: meta,
            conversationContext: meta.context || [],
          };
        });

        setLocalMessages(adapted);
      } catch (e) {
        console.error("[MessagesLog] unexpected error loading messages", e);
        setLoadError(e.message);
        setLocalMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [supabase, tenant?.id]);

  // Stats calculadas
  const stats = useMemo(() => {
    const totalMessages = localMessages.length;
    const todayStr = new Date().toDateString();

    const sentToday = localMessages.filter(
      (m) =>
        m.direction === "outbound" &&
        new Date(m.timestamp).toDateString() === todayStr
    ).length;

    const receivedToday = localMessages.filter(
      (m) =>
        m.direction === "inbound" &&
        new Date(m.timestamp).toDateString() === todayStr
    ).length;

    const failedMessages = localMessages.filter(
      (m) => m.status === "failed"
    ).length;

    return { totalMessages, sentToday, receivedToday, failedMessages };
  }, [localMessages]);

  // Filtros
  const filteredMessages = useMemo(() => {
    let data = [...localMessages];

    if (activeFilters?.dateFrom) {
      const from = new Date(activeFilters.dateFrom);
      data = data.filter((m) => new Date(m.timestamp) >= from);
    }

    if (activeFilters?.dateTo) {
      const to = new Date(activeFilters.dateTo);
      data = data.filter((m) => new Date(m.timestamp) <= to);
    }

    if (activeFilters?.contact) {
      const q = activeFilters.contact.toLowerCase();
      data = data.filter(
        (m) =>
          (m.contact && m.contact.toLowerCase().includes(q)) ||
          (m.contactName && m.contactName.toLowerCase().includes(q))
      );
    }

    if (activeFilters?.status) {
      data = data.filter((m) => m.status === activeFilters.status);
    }

    if (activeFilters?.keyword) {
      const k = activeFilters.keyword.toLowerCase();
      data = data.filter((m) =>
        (m.body || "").toLowerCase().includes(k)
      );
    }

    // Si hay conversación seleccionada, filtrar por ese contacto
    if (selectedConversation?.contact) {
      data = data.filter(
        (m) => m.contact === selectedConversation.contact
      );
    }

    return data;
  }, [localMessages, activeFilters, selectedConversation]);

  // Conversaciones agrupadas desde los mensajes
  const conversations = useMemo(() => {
    const map = new Map();

    for (const m of localMessages) {
      const key = m.contact;
      const prev =
        map.get(key) || {
          id: key,
          contact: key,
          contactName: m.contactName || key,
          lastMessage: "",
          lastMessageTime: new Date(0),
          messageCount: 0,
          unreadCount: 0,
          status: "active",
        };

      const newer = new Date(m.timestamp) > new Date(prev.lastMessageTime);

      map.set(key, {
        ...prev,
        lastMessage: newer ? m.body : prev.lastMessage,
        lastMessageTime: newer ? m.timestamp : prev.lastMessageTime,
        messageCount: prev.messageCount + 1,
        status:
          newer && m.direction === "inbound" ? "active" : prev.status,
      });
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
  }, [localMessages]);

  const handleFilterChange = (filters) => setActiveFilters(filters);

  const handleBulkAction = (action, messageIds) => {
    console.log(`Performing ${action} on messages:`, messageIds);
    // TODO: luego update real en DB
  };

  const handleExport = () => {
    const rows = filteredMessages.map((m) => ({
      id: m.id,
      messageId: m.messageId,
      contact: m.contact,
      contactName: m.contactName,
      direction: m.direction,
      status: m.status,
      timestamp: new Date(m.timestamp).toISOString(),
      body: (m.body || "").replace(/\n/g, " "),
    }));

    if (rows.length === 0) return;

    const header = Object.keys(rows[0]).join(",");
    const csv = [
      header,
      ...rows.map((r) =>
        Object.values(r)
          .map((v) =>
            `"${String(v).replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "messages_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleLogout = async () => {
    await logout();
  };

  const currentUser = {
    name: tenant?.name || "Tenant",
    email:
      profile?.role === "tenant"
        ? "tenant@business.com"
        : "admin@whatsappbot.com",
    avatar: null,
    role: profile?.role || "Tenant Admin",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Sidebar */}
      <NavigationSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole="tenant"
      />

      {/* Main Content */}
      <div
        className={`transition-all duration-200 ${
          sidebarCollapsed ? "md:ml-16" : "md:ml-60"
        }`}
      >
        {/* Top Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Messages Log
              </h1>
              <p className="text-muted-foreground">
                Monitor and manage WhatsApp conversations
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                iconName="RefreshCw"
                iconPosition="left"
                onClick={() => window.location?.reload()}
              >
                Refresh
              </Button>

              <UserProfileDropdown
                user={currentUser}
                onLogout={handleLogout}
                onProfileClick={() =>
                  console.log("Profile clicked")
                }
              />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {loadError && (
            <div className="mb-4 p-4 border border-destructive rounded bg-destructive/10 text-destructive text-sm">
              Error loading messages: {loadError}
            </div>
          )}

          {loadingMessages && (
            <div className="mb-4 text-sm text-muted-foreground">
              Loading messages...
            </div>
          )}

          {/* Stats Cards */}
          <MessageStats stats={stats} />

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Messages Section */}
            <div className="xl:col-span-3 space-y-6">
              {/* Filters */}
              <MessageFilters
                onFilterChange={handleFilterChange}
                onExport={handleExport}
              />

              {/* Messages Table */}
              <MessageTable
                messages={filteredMessages}
                onBulkAction={handleBulkAction}
              />
            </div>

            {/* Conversations Sidebar */}
            <div className="xl:col-span-1">
              <ConversationSummary
                conversations={conversations}
                onSelectConversation={handleSelectConversation}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MessagesLog;
