// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-dashboard\index.jsx

import React, { useState, useEffect } from "react";
import NavigationSidebar from "../../components/ui/NavigationSidebar";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import MetricsCard from "./components/MetricsCard";
import ActivityFeed from "./components/ActivityFeed";
import QuickActions from "./components/QuickActions";
import ActiveConversations from "./components/ActiveConversations";
import OnboardingChecklist from "./components/OnboardingChecklist";
import Icon from "../../components/AppIcon";

import { useAuth } from "../../lib/AuthProvider";
import { supabase } from "../../lib/supabaseClient";

const TenantDashboard = () => {
  const { session, profile, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [tenantInfo, setTenantInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [flows, setFlows] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activities, setActivities] = useState([]);

  // 🔹 Cargar datos reales del tenant desde Supabase
  useEffect(() => {
    const loadData = async () => {
      // Si todavía no tenemos profile cargado, esperamos
      if (!profile) return;

      // Si el usuario no está asociado a ningún tenant todavía,
      // mostramos dashboard vacío pero sin romper nada.
      if (!profile.tenant_id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // 1) Tenant info
        const { data: tenant, error: tenantError } = await supabase
          .from("tenants")
          .select("id, name, slug")
          .eq("id", profile.tenant_id)
          .single();

        if (tenantError) {
          console.error("Error loading tenant", tenantError);
        } else {
          setTenantInfo(tenant);
        }

        // 2) Mensajes del tenant (últimos 100)
        const { data: msgs, error: msgsError } = await supabase
          .from("messages")
          .select(
            "id, direction, body, created_at, sender, conversation_id, tenant_id, channel_id"
          )
          .eq("tenant_id", profile.tenant_id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (msgsError) {
          console.error("Error loading messages", msgsError);
          setMessages([]);
        } else {
          setMessages(msgs || []);
        }

        // 3) Flows asociados a bots del tenant
        //   flows -> bot_id -> bots.tenant_id
        const { data: flowsData, error: flowsError } = await supabase
          .from("flows")
          .select("id, key, bots!inner(tenant_id)")
          .eq("bots.tenant_id", profile.tenant_id);

        if (flowsError) {
          console.error("Error loading flows", flowsError);
          setFlows([]);
        } else {
          setFlows(flowsData || []);
        }

        // 4) Conversaciones del tenant (últimas 10 por actividad)
        const { data: convs, error: convsError } = await supabase
          .from("conversations")
          .select("id, contact_phone, status, last_message_at")
          .eq("tenant_id", profile.tenant_id)
          .order("last_message_at", { ascending: false })
          .limit(10);

        if (convsError) {
          console.error("Error loading conversations", convsError);
          setConversations([]);
        } else {
          // Para cada conversación buscamos su último mensaje
          const convItems = (convs || []).map((c) => {
            const lastMsg = (msgs || []).find(
              (m) => m.conversation_id === c.id
            );

            return {
              id: c.id,
              name: c.contact_phone || "Contacto",
              phone: c.contact_phone || "",
              avatar:
                "https://images.unsplash.com/photo-1564581335312-88ba5f1ae29f?auto=format&fit=crop&w=150&h=150",
              avatarAlt: "Contact avatar",
              lastMessage: lastMsg?.body || "Sin mensajes todavía",
              lastSeen: c.last_message_at || lastMsg?.created_at,
              status:
                c.status === "open"
                  ? "active"
                  : c.status === "pending"
                  ? "pending"
                  : "resolved",
              unreadCount: 0, // más adelante podemos calcular esto
            };
          });

          setConversations(convItems);
        }

        // 5) Actividad reciente basada en lo que tenemos
        const latestMsg = (msgs || [])[0];
        const now = new Date();

        const activityItems = [];

        if (latestMsg) {
          activityItems.push({
            id: "last_message",
            type:
              latestMsg.direction === "in"
                ? "message_received"
                : "message_sent",
            title:
              latestMsg.direction === "in"
                ? "Nuevo mensaje entrante"
                : "Mensaje enviado",
            description: latestMsg.body?.slice(0, 80) || "",
            timestamp: latestMsg.created_at,
            status: "success",
          });
        }

        if ((flowsData || []).length > 0) {
          activityItems.push({
            id: "flows_count",
            type: "flow_triggered",
            title: "Flujos configurados",
            description: `Tenés ${flowsData.length} flujo(s) configurado(s) en tu bot`,
            timestamp: now.toISOString(),
            status: "success",
          });
        }

        setActivities(activityItems);
      } catch (err) {
        console.error("Unexpected error loading dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [profile]);

  // 🔹 Métricas calculadas en base a messages/flows
  const totalMessages = messages.length;
  const inCount = messages.filter((m) => m.direction === "in").length;
  const outCount = messages.filter((m) => m.direction === "out").length;
  const activeFlows = flows.length;

  const metrics = [
    {
      title: "Messages Sent",
      value: String(outCount),
      change: totalMessages ? "+100%" : "—",
      changeType: totalMessages ? "positive" : "neutral",
      icon: "Send",
      color: "primary",
    },
    {
      title: "Messages Received",
      value: String(inCount),
      change: totalMessages ? "+100%" : "—",
      changeType: totalMessages ? "positive" : "neutral",
      icon: "MessageCircle",
      color: "success",
    },
    {
      title: "Active Flows",
      value: String(activeFlows),
      change: activeFlows ? "+100%" : "—",
      changeType: activeFlows ? "positive" : "neutral",
      icon: "GitBranch",
      color: "secondary",
    },
    {
      title: "Total Messages",
      value: String(totalMessages),
      change: "—",
      changeType: "neutral",
      icon: "BarChart3",
      color: "warning",
    },
  ];

  // 🔹 Usuario actual mostrado en el header
  const currentUser = {
    name:
      tenantInfo?.name ||
      profile?.tenant?.name ||
      session?.user?.user_metadata?.full_name ||
      session?.user?.email ||
      "User",
    email: session?.user?.email || "user@example.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    role: profile?.role || "tenant",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Sidebar */}
      <NavigationSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={profile?.role || "tenant"}
      />

      {/* Main Content */}
      <div
        className={`transition-all duration-200 ${
          sidebarCollapsed ? "md:ml-16" : "md:ml-60"
        }`}
      >
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {currentUser?.name}! Here&apos;s what&apos;s
                  happening with your WhatsApp bot.
                </p>
                {profile && !profile.tenant_id && (
                  <p className="mt-1 text-xs text-amber-600">
                    Tu usuario todavía no está asociado a ningún workspace
                    (tenant). Podés vincularlo creando uno o agregando tu
                    usuario en <code>tenant_members</code>.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md micro-animation relative">
                <Icon name="Bell" size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
              </button>

              {/* User Profile Dropdown */}
              <UserProfileDropdown
                user={currentUser}
                onLogout={logout}
                onProfileClick={() => console.log("profile")}
              />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <MetricsCard
                key={index}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                changeType={metric.changeType}
                icon={metric.icon}
                color={metric.color}
                isLoading={isLoading}
              />
            ))}
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Activity Feed & Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <ActivityFeed activities={activities} isLoading={isLoading} />
              <QuickActions />
            </div>

            {/* Right Column - Conversations & Onboarding */}
            <div className="space-y-6">
              <OnboardingChecklist
                onComplete={() => console.log("Onboarding completed")}
              />
              <ActiveConversations
                conversations={conversations}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Additional Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Response Time
                </h3>
                <Icon
                  name="Clock"
                  size={20}
                  className="text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-sm text-muted-foreground">
                  Más adelante podemos calcular esto con tiempos de respuesta
                  reales
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Customer Satisfaction
                </h3>
                <Icon
                  name="Heart"
                  size={20}
                  className="text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-sm text-muted-foreground">
                  Podés agregar encuestas / NPS más adelante
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Active Flows
                </h3>
                <Icon
                  name="GitBranch"
                  size={20}
                  className="text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">
                  {activeFlows}
                </p>
                <p className="text-sm text-muted-foreground">
                  Flujos actuales en tu workspace
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantDashboard;
