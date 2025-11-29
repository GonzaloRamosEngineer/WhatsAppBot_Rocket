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
  const [channelSummary, setChannelSummary] = useState({
    hasChannel: false,
    isActive: false,
    phone: null,
    displayName: null,
  });

  // 🔹 Cargar datos reales del tenant desde Supabase
  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;

      // Usuario sin tenant asociado todavía
      if (!profile.tenant_id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // 1) Info del tenant
        const { data: tenant, error: tenantError } = await supabase
          .from("tenants")
          .select("id, name, slug")
          .eq("id", profile.tenant_id)
          .single();

        if (tenantError) {
          console.error("Error cargando tenant", tenantError);
        } else {
          setTenantInfo(tenant);
        }

        // 2) Mensajes del tenant (últimos 200)
        const { data: msgs, error: msgsError } = await supabase
          .from("messages")
          .select(
            "id, direction, body, created_at, sender, conversation_id, tenant_id, channel_id"
          )
          .eq("tenant_id", profile.tenant_id)
          .order("created_at", { ascending: false })
          .limit(200);

        if (msgsError) {
          console.error("Error cargando mensajes", msgsError);
          setMessages([]);
        } else {
          setMessages(msgs || []);
        }

        // 3) Flows asociados a bots del tenant
        const { data: flowsData, error: flowsError } = await supabase
          .from("flows")
          .select("id, key, bots!inner(tenant_id)")
          .eq("bots.tenant_id", profile.tenant_id);

        if (flowsError) {
          console.error("Error cargando flows", flowsError);
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
          console.error("Error cargando conversaciones", convsError);
          setConversations([]);
        } else {
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
              avatarAlt: "Avatar contacto",
              lastMessage: lastMsg?.body || "Sin mensajes todavía",
              lastSeen: c.last_message_at || lastMsg?.created_at,
              status:
                c.status === "open"
                  ? "active"
                  : c.status === "pending"
                  ? "pending"
                  : "resolved",
              unreadCount: 0,
            };
          });

          setConversations(convItems);
        }

        // 5) Estado de canales de WhatsApp del tenant
        const { data: channels, error: channelsError } = await supabase
          .from("channels")
          .select("id, type, status, phone, display_name")
          .eq("tenant_id", profile.tenant_id)
          .eq("type", "whatsapp");

        if (channelsError) {
          console.error("Error cargando canales", channelsError);
          setChannelSummary({
            hasChannel: false,
            isActive: false,
            phone: null,
            displayName: null,
          });
        } else if (channels && channels.length > 0) {
          const activeChannel =
            channels.find((c) => c.status === "active") || channels[0];

          setChannelSummary({
            hasChannel: true,
            isActive: activeChannel.status === "active",
            phone: activeChannel.phone,
            displayName: activeChannel.display_name,
          });
        } else {
          setChannelSummary({
            hasChannel: false,
            isActive: false,
            phone: null,
            displayName: null,
          });
        }

        // 6) Actividad reciente basada en lo que tenemos
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

        if (channelSummary?.hasChannel) {
          activityItems.push({
            id: "channel_state",
            type: "channel_connected",
            title: "Estado de canales",
            description: channelSummary.isActive
              ? "Tenés al menos un canal de WhatsApp activo"
              : "Tenés un canal configurado pero inactivo",
            timestamp: now.toISOString(),
            status: channelSummary.isActive ? "success" : "pending",
          });
        }

        setActivities(activityItems);
      } catch (err) {
        console.error("Error inesperado cargando el dashboard", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // 🔹 Métricas calculadas en base a messages / flows / conversations
  const totalMessages = messages.length;
  const inCount = messages.filter((m) => m.direction === "in").length;
  const outCount = messages.filter((m) => m.direction === "out").length;
  const activeFlows = flows.length;

  const now = new Date();
  const sevenDaysAgo = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 6
  );
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const messagesLast7Days = messages.filter(
    (m) => new Date(m.created_at) >= sevenDaysAgo
  );
  const messagesToday = messages.filter(
    (m) => new Date(m.created_at) >= startOfToday
  );

  const automationMessages = messages.filter(
    (m) =>
      m.sender === "bot" ||
      (typeof m.sender === "string" &&
        m.sender.startsWith("system_"))
  );

  const automationRate = totalMessages
    ? Math.round((automationMessages.length / totalMessages) * 100)
    : 0;

  const activeConvCount = conversations.filter(
    (c) => c.status === "active"
  ).length;
  const pendingConvCount = conversations.filter(
    (c) => c.status === "pending"
  ).length;
  const resolvedConvCount = conversations.filter(
    (c) => c.status === "resolved"
  ).length;

  const metrics = [
    {
      title: "Mensajes enviados (últimos 7 días)",
      value: String(
        messagesLast7Days.filter((m) => m.direction === "out").length
      ),
      change: messagesToday.length
        ? `${messagesToday.filter((m) => m.direction === "out").length} hoy`
        : "Sin datos hoy",
      changeType: messagesToday.length ? "positive" : "neutral",
      icon: "Send",
      color: "primary",
    },
    {
      title: "Mensajes recibidos (últimos 7 días)",
      value: String(
        messagesLast7Days.filter((m) => m.direction === "in").length
      ),
      change: messagesToday.length
        ? `${messagesToday.filter((m) => m.direction === "in").length} hoy`
        : "Sin datos hoy",
      changeType: messagesToday.length ? "positive" : "neutral",
      icon: "MessageCircle",
      color: "success",
    },
    {
      title: "Nivel de automatización del bot",
      value: totalMessages ? `${automationRate}%` : "—",
      change: totalMessages
        ? `${automationMessages.length} mensajes automáticos`
        : "Aún sin actividad",
      changeType: automationRate >= 60 ? "positive" : "neutral",
      icon: "Cpu",
      color: "secondary",
    },
    {
      title: "Flujos activos",
      value: String(activeFlows),
      change: activeFlows ? "Flujos en tu workspace" : "Creá tu primer flujo",
      changeType: activeFlows ? "positive" : "neutral",
      icon: "GitBranch",
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
      "Usuario",
    email: session?.user?.email || "usuario@example.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    role: profile?.role || "tenant",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar de navegación */}
      <NavigationSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={profile?.role || "tenant"}
      />

      {/* Contenido principal */}
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
                  Panel de control
                </h1>
                <p className="text-sm text-muted-foreground">
                  ¡Bienvenido de nuevo, {currentUser?.name}! Acá ves cómo
                  viene funcionando tu bot de WhatsApp.
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
              {/* Notificaciones */}
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md micro-animation relative">
                <Icon name="Bell" size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
              </button>

              {/* Usuario */}
              <UserProfileDropdown
                user={currentUser}
                onLogout={logout}
                onProfileClick={() => console.log("profile")}
              />
            </div>
          </div>
        </header>

        {/* Barra de estado del canal */}
        <div className="px-6 pt-4">
          <div className="bg-card border border-border rounded-lg p-4 flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  channelSummary.isActive ? "bg-success" : "bg-muted-foreground"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {channelSummary.hasChannel
                    ? channelSummary.isActive
                      ? "Canal de WhatsApp conectado"
                      : "Canal configurado pero inactivo"
                    : "Todavía no conectaste ningún canal de WhatsApp"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {channelSummary.hasChannel
                    ? `${channelSummary.displayName || "Canal"} · ${
                        channelSummary.phone || "Sin número registrado"
                      }`
                    : "Configuralo desde la sección Canales para empezar a recibir mensajes."}
                </p>
              </div>
            </div>
            {channelSummary.hasChannel && (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Icon name="Activity" size={16} />
                <span>Webhook en tiempo real habilitado</span>
              </div>
            )}
          </div>
        </div>

        {/* Contenido del dashboard */}
        <main className="p-6 space-y-6">
          {/* Métricas principales */}
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

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Izquierda - Actividad + Acciones rápidas */}
            <div className="lg:col-span-2 space-y-6">
              <ActivityFeed activities={activities} isLoading={isLoading} />
              <QuickActions />
            </div>

            {/* Derecha - Checklist + Conversaciones activas */}
            <div className="space-y-6">
              <OnboardingChecklist
                isChannelConnected={channelSummary.isActive}
                hasFlows={activeFlows > 0}
                hasMessages={totalMessages > 0}
                onComplete={() => console.log("Onboarding completado")}
              />
              <ActiveConversations
                conversations={conversations}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Sección de insights adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Inteligencia del bot */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Inteligencia del bot
                </h3>
                <Icon
                  name="Cpu"
                  size={20}
                  className="text-muted-foreground"
                />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Vista rápida de cuánto está trabajando tu asistente automático.
              </p>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Nivel de automatización
                  </p>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl font-bold text-foreground">
                      {totalMessages ? `${automationRate}%` : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {automationMessages.length} mensajes automáticos
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${automationRate || 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                    <p className="text-muted-foreground">
                      Mensajes totales (muestra)
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {totalMessages}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-md">
                    <p className="text-muted-foreground">
                      Mensajes de hoy (muestra)
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {messagesToday.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Embudo de conversaciones */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Embudo de conversaciones
                </h3>
                <Icon
                  name="Filter"
                  size={20}
                  className="text-muted-foreground"
                />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Estado de las últimas conversaciones en tu workspace.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Totales</span>
                  <span className="font-semibold text-foreground">
                    {conversations.length}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-success h-2"
                    style={{
                      width: `${
                        conversations.length
                          ? (activeConvCount / conversations.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                  <div
                    className="bg-warning h-2"
                    style={{
                      width: `${
                        conversations.length
                          ? (pendingConvCount / conversations.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                  <div
                    className="bg-muted-foreground/60 h-2"
                    style={{
                      width: `${
                        conversations.length
                          ? (resolvedConvCount / conversations.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs mt-2">
                  <div className="p-2 rounded-md bg-success/5 border border-success/20">
                    <p className="text-muted-foreground">Abiertas</p>
                    <p className="text-lg font-semibold text-foreground">
                      {activeConvCount}
                    </p>
                  </div>
                  <div className="p-2 rounded-md bg-warning/5 border border-warning/20">
                    <p className="text-muted-foreground">En seguimiento</p>
                    <p className="text-lg font-semibold text-foreground">
                      {pendingConvCount}
                    </p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/40 border border-border">
                    <p className="text-muted-foreground">Resueltas</p>
                    <p className="text-lg font-semibold text-foreground">
                      {resolvedConvCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flujos activos / futuro NPS */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Salud del workspace
                </h3>
                <Icon
                  name="HeartPulse"
                  size={20}
                  className="text-muted-foreground"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Flujos activos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {activeFlows}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Flujos actuales en tu workspace
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Tiempo de respuesta
                  </p>
                  <p className="text-lg font-semibold text-foreground">—</p>
                  <p className="text-xs text-muted-foreground">
                    Más adelante podemos calcular esto con tiempos de
                    respuesta reales.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Satisfacción del cliente
                  </p>
                  <p className="text-lg font-semibold text-foreground">—</p>
                  <p className="text-xs text-muted-foreground">
                    Podés agregar encuestas / NPS más adelante.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantDashboard;
