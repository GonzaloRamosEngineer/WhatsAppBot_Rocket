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
import Button from "../../components/ui/Button"; // Asegúrate de tener este componente

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
              avatar: null, // Placeholder handled by component
              avatarAlt: "Avatar contacto",
              lastMessage: lastMsg?.body || "Sin mensajes todavía",
              lastSeen: c.last_message_at || lastMsg?.created_at,
              status: c.status === "open" ? "active" : c.status === "pending" ? "pending" : "resolved",
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
          setChannelSummary({ hasChannel: false, isActive: false, phone: null, displayName: null });
        } else if (channels && channels.length > 0) {
          const activeChannel = channels.find((c) => c.status === "active") || channels[0];
          setChannelSummary({
            hasChannel: true,
            isActive: activeChannel.status === "active",
            phone: activeChannel.phone,
            displayName: activeChannel.display_name,
          });
        } else {
          setChannelSummary({ hasChannel: false, isActive: false, phone: null, displayName: null });
        }

        // 6) Actividad reciente basada en lo que tenemos
        const latestMsg = (msgs || [])[0];
        const now = new Date();
        const activityItems = [];

        if (latestMsg) {
          activityItems.push({
            id: "last_message",
            type: latestMsg.direction === "in" ? "message_received" : "message_sent",
            title: latestMsg.direction === "in" ? "Nuevo mensaje entrante" : "Mensaje enviado",
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
  }, [profile]);

  // 🔹 Métricas calculadas
  const totalMessages = messages.length;
  const inCount = messages.filter((m) => m.direction === "in").length;
  const outCount = messages.filter((m) => m.direction === "out").length;
  const activeFlows = flows.length;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const messagesLast7Days = messages.filter((m) => new Date(m.created_at) >= sevenDaysAgo);
  const messagesToday = messages.filter((m) => new Date(m.created_at) >= startOfToday);

  const automationMessages = messages.filter(
    (m) => m.sender === "bot" || (typeof m.sender === "string" && m.sender.startsWith("system_"))
  );

  const automationRate = totalMessages
    ? Math.round((automationMessages.length / totalMessages) * 100)
    : 0;

  const activeConvCount = conversations.filter((c) => c.status === "active").length;
  const pendingConvCount = conversations.filter((c) => c.status === "pending").length;
  const resolvedConvCount = conversations.filter((c) => c.status === "resolved").length;

  const metrics = [
    {
      title: "Outbound Messages",
      value: String(messagesLast7Days.filter((m) => m.direction === "out").length),
      change: messagesToday.length ? `${messagesToday.filter((m) => m.direction === "out").length} today` : "No data today",
      changeType: messagesToday.length ? "positive" : "neutral",
      icon: "Send",
      color: "blue", // Usamos nombres de color para que MetricsCard decida el estilo
    },
    {
      title: "Inbound Messages",
      value: String(messagesLast7Days.filter((m) => m.direction === "in").length),
      change: messagesToday.length ? `${messagesToday.filter((m) => m.direction === "in").length} today` : "No data today",
      changeType: messagesToday.length ? "positive" : "neutral",
      icon: "MessageCircle",
      color: "emerald",
    },
    {
      title: "Automation Rate",
      value: totalMessages ? `${automationRate}%` : "—",
      change: totalMessages ? `${automationMessages.length} automated msgs` : "No activity yet",
      changeType: automationRate >= 60 ? "positive" : "neutral",
      icon: "Cpu",
      color: "purple",
    },
    {
      title: "Active Flows",
      value: String(activeFlows),
      change: activeFlows ? "Running workflows" : "Create your first flow",
      changeType: activeFlows ? "positive" : "neutral",
      icon: "GitBranch",
      color: "amber",
    },
  ];

  const currentUser = {
    name: tenantInfo?.name || profile?.tenant?.name || session?.user?.user_metadata?.full_name || "User",
    email: session?.user?.email || "user@example.com",
    avatar: null,
    role: profile?.role || "Tenant Admin",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Sidebar Responsivo */}
      <NavigationSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={profile?.role || "tenant"}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-60"}`}>
        
        {/* Header - Dashboard (Estilo Unificado) */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm shrink-0">
                  <Icon name="LayoutDashboard" size={20} />
               </div>
               <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Dashboard</h1>
                  <p className="text-slate-500 text-xs font-medium">
                    Welcome back, {currentUser.name}. Overview of your bot performance.
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-4 self-end md:self-auto">
              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all relative">
                <Icon name="Bell" size={20} />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
              <UserProfileDropdown user={currentUser} onLogout={logout} />
            </div>
          </div>
          
          {/* Alerta de Tenant Faltante (Integrada) */}
          {profile && !profile.tenant_id && (
             <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-sm text-amber-800 animate-in fade-in slide-in-from-top-2">
                <Icon name="AlertTriangle" size={18} />
                <span><strong>Action Required:</strong> Your user is not linked to any workspace. Please contact support or create a tenant.</span>
             </div>
          )}
        </header>

        {/* Contenido Principal */}
        <main className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
          
          {/* Barra de Estado del Canal (Estilo Banner Moderno) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${channelSummary.isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                   <Icon name={channelSummary.isActive ? "CheckCircle" : "AlertCircle"} size={20} />
                </div>
                <div>
                   <h3 className="text-sm font-bold text-slate-800">
                      {channelSummary.hasChannel 
                         ? (channelSummary.isActive ? "WhatsApp Connected" : "Channel Inactive") 
                         : "No Channel Connected"}
                   </h3>
                   <p className="text-xs text-slate-500">
                      {channelSummary.hasChannel 
                         ? `${channelSummary.displayName || "My Business"} • ${channelSummary.phone || "No phone"}` 
                         : "Connect a number in Channel Settings to start."}
                   </p>
                </div>
             </div>
             
             {channelSummary.hasChannel && (
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-xs font-mono text-slate-500">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   Webhook Active
                </div>
             )}
             
             {!channelSummary.hasChannel && (
                <Button variant="default" size="sm" onClick={() => window.location.href='/channel-setup'}>
                   Connect Now
                </Button>
             )}
          </div>

          {/* Grid de Métricas (Responsivo: 1 col móvil -> 2 col tablet -> 4 col desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
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

          {/* Sección Central (2 Columnas asimétricas) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna Izquierda (Ancha): Actividad + Acciones */}
            <div className="lg:col-span-2 space-y-8">
              <ActivityFeed activities={activities} isLoading={isLoading} />
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Quick Actions</h3>
                 <QuickActions />
              </div>
            </div>

            {/* Columna Derecha (Estrecha): Checklist + Conversaciones */}
            <div className="space-y-8">
              <OnboardingChecklist
                isChannelConnected={channelSummary.isActive}
                hasFlows={activeFlows > 0}
                hasMessages={totalMessages > 0}
                onComplete={() => console.log("Onboarding Complete")}
              />
              <ActiveConversations
                conversations={conversations}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Sección Inferior: Insights (Grid de 3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Bot Intelligence Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">Bot Intelligence</h3>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                   <Icon name="Cpu" size={18} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1">
                     <span className="text-xs text-slate-500 font-medium">Automation Level</span>
                     <span className="text-xl font-bold text-slate-800">{totalMessages ? `${automationRate}%` : "—"}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${automationRate || 0}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 text-right">{automationMessages.length} auto-replies sent</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                      <span className="block text-lg font-bold text-slate-700">{totalMessages}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total Msgs</span>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                      <span className="block text-lg font-bold text-slate-700">{messagesToday.length}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Today</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Conversation Funnel Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">Conversation Funnel</h3>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                   <Icon name="Filter" size={18} />
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Total Active Threads</span>
                    <span className="text-slate-800 font-bold">{conversations.length}</span>
                 </div>
                 
                 {/* Visual Bar Funnel */}
                 <div className="flex h-3 rounded-full overflow-hidden w-full bg-slate-100">
                    <div className="bg-emerald-500 h-full" style={{ width: `${conversations.length ? (activeConvCount/conversations.length)*100 : 0}%` }} title="Open" />
                    <div className="bg-amber-400 h-full" style={{ width: `${conversations.length ? (pendingConvCount/conversations.length)*100 : 0}%` }} title="Pending" />
                    <div className="bg-slate-300 h-full" style={{ width: `${conversations.length ? (resolvedConvCount/conversations.length)*100 : 0}%` }} title="Resolved" />
                 </div>

                 <div className="space-y-2 mt-2">
                    <div className="flex justify-between text-xs">
                       <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Open</span>
                       <span className="font-bold">{activeConvCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                       <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Pending</span>
                       <span className="font-bold">{pendingConvCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                       <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Resolved</span>
                       <span className="font-bold">{resolvedConvCount}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Health Score Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">Workspace Health</h3>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                   <Icon name="HeartPulse" size={18} />
                </div>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium text-slate-600">Active Workflows</span>
                    <span className="text-lg font-bold text-indigo-600">{activeFlows}</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg opacity-60">
                    <span className="text-xs font-medium text-slate-600">Response Time</span>
                    <span className="text-xs font-mono text-slate-400">-- ms</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg opacity-60">
                    <span className="text-xs font-medium text-slate-600">Cust. Satisfaction</span>
                    <span className="text-xs font-mono text-slate-400">-- / 5.0</span>
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