// C:\Projects\WhatsAppBot_Rocket\src\pages\channel-setup\index.jsx

import React, { useState, useEffect, useCallback } from "react";
import NavigationSidebar from "../../components/ui/NavigationSidebar";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";

// Componentes internos
import CredentialsForm from "./components/CredentialsForm";
import ConnectionTestCard from "./components/ConnectionTestCard";
import WebhookConfigCard from "./components/WebhookConfigCard";
import ChannelStatusCard from "./components/ChannelStatusCard";
import ChannelSelector from "./components/ChannelSelector";
import TemplatesListCard from "./components/TemplatesListCard";

// Libs
import { useAuth } from "@/lib/AuthProvider";
import { useSyncTemplates } from "@/lib/useSyncTemplates";

const ChannelSetup = () => {
  const { profile, tenant, supabase, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // --- STATE UI ---
  // El famoso "Acordeón Inteligente"
  const [isConfigExpanded, setIsConfigExpanded] = useState(true);

  // --- STATE LOGIC ---
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  // Manual Credentials State
  const [credentials, setCredentials] = useState({
    phoneNumberId: "",
    wabaId: "",
    accessToken: "",
    businessName: "",
  });

  // Status State
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [channelData, setChannelData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Templates State
  const [templates, setTemplates] = useState([]);
  const { loading: syncingTemplates, sync } = useSyncTemplates();

  // Meta Discovery State
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState(null);
  const [wabas, setWabas] = useState([]); 
  const [connectingNumberId, setConnectingNumberId] = useState(null);

  // --- HELPERS ---

  const loadLocalCredentials = () => {
    const saved = localStorage.getItem("whatsapp_credentials");
    return saved ? JSON.parse(saved) : {};
  };

  const saveLocalCredentials = (credentialsData) => {
    localStorage.setItem("whatsapp_credentials", JSON.stringify(credentialsData));
  };

  // Carga Templates desde DB
  const loadTemplatesForChannel = useCallback(
    async (channelId) => {
      if (!supabase || !channelId) {
        setTemplates([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("templates")
          .select("id, name, language, category, status, body, last_synced_at")
          .eq("channel_id", channelId)
          // Ordenamos por status para que los APPROVED salgan primero
          .order("status", { ascending: true }) 
          .order("name", { ascending: true });

        if (error) throw error;
        setTemplates(data || []);
      } catch (e) {
        console.error("[ChannelSetup] error loading templates", e);
        setTemplates([]);
      }
    },
    [supabase]
  );

  // REFRESH CHANNELS (El corazón de tu lógica)
  const refreshChannels = useCallback(async () => {
    if (!supabase || !tenant?.id) return;

    try {
      setLoadError(null);
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("type", "whatsapp")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const list = data || [];
      setChannels(list);
      const savedCreds = loadLocalCredentials();

      if (list.length > 0) {
        // --- LOGICA DE ACORDEÓN: Si hay canales, cerramos el setup ---
        setIsConfigExpanded(false); 

        const active = list.find((c) => c.status === "active") || list[0];
        setSelectedChannelId(active.id);
        localStorage.setItem("activeChannel", active.id);

        setCredentials({
          phoneNumberId: active.phone_id || savedCreds.phoneNumberId || "",
          wabaId: active.meta_waba_id || savedCreds.wabaId || "",
          accessToken: savedCreds.accessToken || "",
          businessName: active.display_name || savedCreds.businessName || tenant?.name || "My Business",
        });

        setChannelData({
          channelId: active.id,
          businessName: active.display_name || savedCreds.businessName || tenant?.name || "My Business",
          phoneNumber: active.phone || null,
          phoneNumberId: active.phone_id || null,
          wabaId: active.meta_waba_id || null,
          isActive: active.status === "active",
          lastSync: active.created_at || new Date().toISOString(),
          stats: { messagesToday: 0, messagesThisMonth: 0, activeChats: 0 },
        });

        setIsConnected(!!active.status && active.status !== "disconnected");
        await loadTemplatesForChannel(active.id);
      } else {
        // --- LOGICA DE ACORDEÓN: Si NO hay canales, abrimos el setup ---
        setIsConfigExpanded(true);

        setSelectedChannelId(null);
        localStorage.removeItem("activeChannel");
        setCredentials({
          phoneNumberId: "",
          wabaId: "",
          accessToken: "",
          businessName: tenant?.name || "My Business",
        });
        setChannelData(null);
        setIsConnected(false);
        setTemplates([]);
      }
    } catch (e) {
      console.error("[ChannelSetup] error channels", e);
      setLoadError(e.message);
    }
  }, [supabase, tenant?.id, tenant?.name, loadTemplatesForChannel]);

  // Init
  useEffect(() => {
    refreshChannels();
  }, [refreshChannels]);

  // OAuth Listener
  useEffect(() => {
    const handler = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "facebook_oauth_success") {
        console.log("[ChannelSetup] OAuth Success, refreshing...");
        window.location.reload();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Handlers
  const handleSelectChannel = (channelId) => {
    setSelectedChannelId(channelId);
    if (channelId) localStorage.setItem("activeChannel", channelId);
    
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) return;

    // Actualizamos datos visuales basados en selección
    setChannelData(prev => ({
        ...prev,
        channelId: channel.id,
        businessName: channel.display_name || prev?.businessName,
        phoneNumber: channel.phone,
        isActive: channel.status === "active"
    }));
    
    loadTemplatesForChannel(channelId);
  };

  const handleCredentialsChange = (newCredentials) => setCredentials(newCredentials);

  const handleSaveCredentials = async (credentialsData) => {
    if (!supabase || !tenant?.id) return;
    setIsSaving(true);
    try {
      saveLocalCredentials(credentialsData);
      const payload = {
        display_name: credentialsData.businessName,
        phone_id: credentialsData.phoneNumberId,
        meta_waba_id: credentialsData.wabaId,
      };

      if (selectedChannelId) {
        await supabase.from("channels").update(payload).eq("id", selectedChannelId);
      } else {
        const { data } = await supabase.from("channels").insert({
            tenant_id: tenant.id, type: "whatsapp", status: "inactive", phone: null, token_alias: null, ...payload
        }).select().single();
        if (data) setSelectedChannelId(data.id);
      }
      await refreshChannels();
      alert("Credentials saved manually.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectionTest = (result) => {
    if (!result) return;
    setIsConnected(!!result.success);
  };

  const handleToggleChannel = async (isActive) => {
    if (!supabase || !selectedChannelId) return;
    setChannelData(prev => ({ ...prev, isActive }));
    await supabase.from("channels").update({ status: isActive ? "active" : "inactive" }).eq("id", selectedChannelId);
    setChannels(prev => prev.map(c => c.id === selectedChannelId ? {...c, status: isActive ? "active" : "inactive"} : c));
  };

  const handleLogout = async () => {
    localStorage.removeItem("whatsapp_credentials");
    await logout();
  };

  // --- META ACTIONS ---
  const handleConnectWithMeta = async () => {
    try {
      if (!supabase || !tenant?.id) return alert("Missing tenant info");
      setConnectingOAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("User not found");

      const { data } = await supabase.from("oauth_states").insert({
        tenant_id: tenant.id, user_id: user.id, provider: "facebook", redirect_to: window.location.href,
      }).select().single();

      if (!data) return alert("Error initializing OAuth");

      const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
      const redirectUri = import.meta.env.VITE_FACEBOOK_REDIRECT_URI;
      const scopes = "public_profile,email,business_management,whatsapp_business_management,whatsapp_business_messaging";
      const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&state=${data.id}&scope=${scopes}&response_type=code&auth_type=rerequest`;
      
      const w = 600, h = 800;
      const left = window.screenX + (window.innerWidth - w) / 2;
      const top = window.screenY + (window.innerHeight - h) / 2;
      window.open(oauthUrl, "facebook_oauth_popup", `width=${w},height=${h},left=${left},top=${top}`);

    } catch (err) {
      console.error(err);
    } finally {
      setConnectingOAuth(false);
    }
  };

  const handleDiscoverFromMeta = async () => {
    if (!supabase || !tenant?.id) return;
    try {
      setDiscovering(true);
      setDiscoverError(null);
      setWabas([]);

      const { data: tokenRow } = await supabase.from("meta_tokens").select("access_token").eq("tenant_id", tenant.id).eq("provider", "facebook").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!tokenRow) {
        setDiscoverError("No Meta token found. Please Connect with Meta first.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("whatsapp-discover", { body: { facebookAccessToken: tokenRow.access_token } });
      if (error) throw error;
      setWabas(data?.wabas || []);

    } catch (e) {
      setDiscoverError(e.message || "Error discovering accounts");
    } finally {
      setDiscovering(false);
    }
  };

  const handleConnectFromMeta = async (waba, phone) => {
    if (!supabase || !tenant?.id) return;
    const resolvedWabaId = waba?.id || waba?.waba_id;
    if (!resolvedWabaId || !phone?.id) return alert("Missing WABA ID or Phone ID");

    try {
      setConnectingNumberId(phone.id);
      const { error } = await supabase.functions.invoke("whatsapp-connect", {
        body: {
            tenantId: tenant.id,
            wabaId: resolvedWabaId,
            phoneId: phone.id,
            displayPhoneNumber: phone.display_phone_number,
            channelName: phone.verified_name || `WhatsApp ${phone.display_phone_number}`,
            tokenAlias: "default"
        }
      });
      if (error) throw error;
      await refreshChannels();
      alert("Channel connected successfully!");
    } catch (e) {
      console.error(e);
      alert("Error connecting number");
    } finally {
      setConnectingNumberId(null);
    }
  };

  const currentUser = {
    name: tenant?.name || "Tenant",
    email: profile?.role === "tenant" ? "tenant@business.com" : "admin@whatsappbot.com",
    avatar: null,
    role: profile?.role || "tenant",
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole="tenant"
      />

      <div className={`transition-all duration-200 ${sidebarCollapsed ? "md:ml-16" : "md:ml-60"}`}>
        
{/* Header - Channel Setup (Responsive Pro) */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm transition-all">
          <div className="px-4 py-3 md:px-8 md:py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* IZQUIERDA: Título + Menú */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                 <div className="flex items-center gap-3">
                    {/* Botón Menú (Solo Móvil) */}
                    <button 
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Icon name="Menu" size={24} />
                    </button>

                    {/* Icono + Títulos */}
                    <div className="flex items-center gap-3">
                       <div className="hidden md:block bg-emerald-600 p-2 rounded-lg text-white shadow-sm shrink-0">
                          <Icon name="MessageSquare" size={20} />
                       </div>
                       <div>
                          <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                             Channel Settings
                          </h1>
                          <p className="text-slate-500 text-xs font-medium hidden sm:block">
                             Manage your WhatsApp Business connection
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* Perfil (Solo Móvil - A la derecha para equilibrio) */}
                 <div className="md:hidden">
                    <UserProfileDropdown user={currentUser} onLogout={handleLogout} />
                 </div>
              </div>
              
              {/* DERECHA: Estado + Perfil (Desktop) */}
              <div className="hidden md:flex items-center gap-6">
                {/* Status Pill (Visible solo en desktop o tablet) */}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border transition-colors ${isConnected ? "bg-emerald-50 border-emerald-200" : "bg-slate-100 border-slate-200"}`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? "bg-emerald-500" : "bg-slate-400"}`} />
                  <span className={`text-xs font-bold ${isConnected ? "text-emerald-700" : "text-slate-500"}`}>
                    {isConnected ? "SYSTEM ONLINE" : "OFFLINE"}
                  </span>
                </div>
                
                <UserProfileDropdown user={currentUser} onLogout={handleLogout} />
              </div>

              {/* Status Bar Móvil (Opcional - Debajo del título si es crítico) */}
              {/* Si quieres mostrar el estado en móvil, descomenta esto: */}
              {/* <div className="md:hidden flex items-center gap-2 text-xs font-medium text-slate-500 border-t border-slate-100 pt-2 mt-1 w-full">
                 <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-slate-400"}`} />
                 <span>Status: {isConnected ? "Online" : "Offline"}</span>
              </div> 
              */}

            </div>
          </div>
        </header>

        <main className="p-8 max-w-[1400px] mx-auto space-y-8">
          
          {/* ERROR ALERT */}
          {loadError && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <Icon name="AlertTriangle" size={16} />
              <span>System Error: {loadError}</span>
            </div>
          )}

          {/* 1. CONNECTION HUB (Collapsible Accordion) */}
          <div className={`bg-white border transition-all duration-300 rounded-xl overflow-hidden ${isConfigExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 shadow-sm'}`}>
            
            {/* Header del Acordeón (Clickable) */}
            <div 
              onClick={() => setIsConfigExpanded(!isConfigExpanded)}
              className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors bg-white"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${channels.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon name="Facebook" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Meta Connection Hub</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {channels.length > 0 ? (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <Icon name="CheckCircle" size={12} /> Connected ({channels.length} assets active)
                      </span>
                    ) : (
                      <span className="text-xs text-orange-500 font-medium flex items-center gap-1">
                         Setup Required
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <span className="text-xs font-semibold text-indigo-600 hover:underline">
                   {isConfigExpanded ? "Hide Setup" : "Manage Connection"}
                 </span>
                 <Icon name={isConfigExpanded ? "ChevronUp" : "ChevronDown"} size={18} className="text-slate-400" />
              </div>
            </div>

            {/* Contenido Desplegable (WIZARD) */}
            {isConfigExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-in slide-in-from-top-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {/* Connect Action */}
                    <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span> 
                            Connect Account
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 ml-7">Authorize permissions via Facebook.</p>
                        <button
                            onClick={handleConnectWithMeta}
                            disabled={connectingOAuth}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium transition-all shadow-sm text-sm"
                        >
                            {connectingOAuth ? "Connecting..." : "Log in with Facebook"}
                        </button>
                    </div>

                    {/* Discover Action */}
                    <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm">
                          <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                            Select Assets
                          </h3>
                          <p className="text-xs text-slate-500 mb-4 ml-7">Find your WABA and Phone Numbers.</p>
                          <button
                            onClick={handleDiscoverFromMeta}
                            disabled={discovering}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-all shadow-sm text-sm"
                          >
                            <Icon name="Search" size={14} />
                            {discovering ? "Searching..." : "Discover Accounts"}
                          </button>
                          {discoverError && <p className="text-xs text-red-500 mt-2">{discoverError}</p>}
                    </div>
                 </div>

                 {/* Discovered List */}
                 {wabas.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-200 max-w-5xl mx-auto animate-in fade-in">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Available Accounts</h4>
                        <div className="grid gap-3">
                            {wabas.map((waba) => (
                                <div key={waba.id} className="border border-slate-200 bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-800 text-sm">{waba.name}</span>
                                        <span className="text-xs font-mono text-slate-400">ID: {waba.id}</span>
                                    </div>
                                    {waba.phone_numbers?.map((p) => (
                                        <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 rounded mt-2 border border-slate-100">
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">{p.display_phone_number}</p>
                                                <p className="text-[10px] text-slate-400">{p.verified_name}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleConnectFromMeta(waba, p)}
                                                disabled={connectingNumberId === p.id}
                                                className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 disabled:opacity-50 font-medium"
                                            >
                                                {connectingNumberId === p.id ? "Linking..." : "Connect"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
              </div>
            )}
          </div>

          {/* 2. ACTIVE CHANNEL & TEMPLATES (Visible always if active) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Columna Izquierda: Status & Config */}
            <div className="xl:col-span-1 space-y-6">
                
                {/* Channel Selector */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                        Active Channel
                    </label>
                    <ChannelSelector
                        channels={channels}
                        selectedChannelId={selectedChannelId}
                        onSelectChannel={handleSelectChannel}
                    />
                </div>

                {/* Status Card (Tu componente existente) */}
                {selectedChannelId && (
                      <ChannelStatusCard
                        isConnected={isConnected}
                        channelData={channelData}
                        onToggleChannel={handleToggleChannel}
                      />
                )}

                {/* Manual Config (Collapsible) - MANTENIDA PERO OCULTA POR DEFECTO */}
                <div className="pt-4 border-t border-slate-200">
                   <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider">
                          <Icon name="Settings" size={14} />
                          <span>Advanced / Manual Config</span>
                          <Icon name="ChevronDown" size={12} className="group-open:rotate-180 transition-transform ml-auto" />
                      </summary>
                      
                      <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                          <CredentialsForm
                              credentials={credentials}
                              onCredentialsChange={handleCredentialsChange}
                              onSave={handleSaveCredentials}
                              isLoading={isSaving}
                          />
                          <div className="space-y-4">
                              <ConnectionTestCard
                                  credentials={credentials}
                                  onTestConnection={handleConnectionTest}
                                  isConnected={isConnected}
                              />
                              <WebhookConfigCard />
                          </div>
                      </div>
                   </details>
                </div>
            </div>

            {/* Columna Derecha: Templates (Protagonista) */}
            <div className="xl:col-span-2">
                {selectedChannelId ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Message Templates</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    await sync(selectedChannelId);
                                    await loadTemplatesForChannel(selectedChannelId);
                                }}
                                disabled={syncingTemplates}
                                iconName="RefreshCw"
                                className={syncingTemplates ? "opacity-70" : ""}
                            >
                                {syncingTemplates ? "Syncing..." : "Sync from Meta"}
                            </Button>
                        </div>
                        
                        {/* Tu componente Pro */}
                        <TemplatesListCard
                            templates={templates}
                            channelId={selectedChannelId}
                        />
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 bg-slate-50/50">
                        <Icon name="MessageSquare" size={32} className="mb-2 opacity-50" />
                        <p>Select a channel to view templates</p>
                    </div>
                )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default ChannelSetup;