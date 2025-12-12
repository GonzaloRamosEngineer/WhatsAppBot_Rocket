// C:\Projects\WhatsAppBot_Rocket\src\pages\channel-setup\index.jsx

import React, { useState, useEffect, useCallback } from "react";
import NavigationSidebar from "../../components/ui/NavigationSidebar";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import Icon from "../../components/AppIcon";

// Componentes internos
import CredentialsForm from "./components/CredentialsForm";
import ConnectionTestCard from "./components/ConnectionTestCard";
import WebhookConfigCard from "./components/WebhookConfigCard";
import ChannelStatusCard from "./components/ChannelStatusCard";
import TroubleshootingCard from "./components/TroubleshootingCard";
import ChannelSelector from "./components/ChannelSelector";
import TemplatesListCard from "./components/TemplatesListCard"; // El componente Pro que hicimos antes

// Libs
import { useAuth } from "@/lib/AuthProvider";
import { useSyncTemplates } from "@/lib/useSyncTemplates";

const ChannelSetup = () => {
  const { profile, tenant, supabase, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // --- STATE ---
  // 🔌 OAuth State
  const [connectingOAuth, setConnectingOAuth] = useState(false);

  // 📺 Channels State
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  // 🔐 Credentials (Manual Mode)
  const [credentials, setCredentials] = useState({
    phoneNumberId: "",
    wabaId: "",
    accessToken: "",
    businessName: "",
  });

  // 🚦 Connection Status
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [channelData, setChannelData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // 📄 Templates State
  const [templates, setTemplates] = useState([]);
  const {
    loading: syncingTemplates,
    result: syncResult,
    sync,
  } = useSyncTemplates();

  // 🌐 Meta Discovery State
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState(null);
  const [wabas, setWabas] = useState([]); 
  const [connectingNumberId, setConnectingNumberId] = useState(null);

  // --- LOGIC HELPERS ---

  const loadLocalCredentials = () => {
    const saved = localStorage.getItem("whatsapp_credentials");
    return saved ? JSON.parse(saved) : {};
  };

  const saveLocalCredentials = (credentialsData) => {
    localStorage.setItem("whatsapp_credentials", JSON.stringify(credentialsData));
  };

  // 🧾 Load Templates
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
          .order("last_synced_at", { ascending: false });

        if (error) {
          console.error("[ChannelSetup] error loading templates", error);
          setTemplates([]);
          return;
        }
        setTemplates(data || []);
      } catch (e) {
        console.error("[ChannelSetup] unexpected error loading templates", e);
        setTemplates([]);
      }
    },
    [supabase]
  );

  // 🧠 Refresh Channels Logic
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

      if (error) {
        console.error("[ChannelSetup] error loading channels", error);
        setLoadError(error.message);
        setChannels([]);
        return;
      }

      const list = data || [];
      setChannels(list);
      const savedCreds = loadLocalCredentials();

      if (list.length > 0) {
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
      console.error("[ChannelSetup] unexpected error channels", e);
      setLoadError(e.message);
    }
  }, [supabase, tenant?.id, tenant?.name, loadTemplatesForChannel]);

  // Init
  useEffect(() => {
    refreshChannels();
  }, [refreshChannels]);

  // 📨 OAuth Popup Listener
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
    const savedCreds = loadLocalCredentials();

    if (channelId) localStorage.setItem("activeChannel", channelId);
    else localStorage.removeItem("activeChannel");

    if (!channelId) {
        // Reset Logic
       setChannelData(null);
       setIsConnected(false);
       setTemplates([]);
       return;
    }

    const channel = channels.find((c) => c.id === channelId);
    if (!channel) return;

    // Update Credentials State based on selection
    setCredentials({
        phoneNumberId: channel.phone_id || savedCreds.phoneNumberId || "",
        wabaId: channel.meta_waba_id || savedCreds.wabaId || "",
        accessToken: savedCreds.accessToken || "",
        businessName: channel.display_name || savedCreds.businessName || tenant?.name || "My Business",
    });

    setChannelData({
        channelId: channel.id,
        businessName: channel.display_name || savedCreds.businessName || tenant?.name || "My Business",
        phoneNumber: channel.phone || null,
        phoneNumberId: channel.phone_id || null,
        wabaId: channel.meta_waba_id || null,
        isActive: channel.status === "active",
        lastSync: channel.created_at || new Date().toISOString(),
        stats: { messagesToday: 0, messagesThisMonth: 0, activeChats: 0 },
    });

    setIsConnected(!!channel.status && channel.status !== "disconnected");
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

      let resultChannel = null;
      if (selectedChannelId) {
        const { data, error } = await supabase.from("channels").update(payload).eq("id", selectedChannelId).select().single();
        if (!error) resultChannel = data;
      } else {
        const { data, error } = await supabase.from("channels").insert({
            tenant_id: tenant.id, type: "whatsapp", status: "inactive", phone: null, token_alias: null, ...payload
        }).select().single();
        if (!error) {
            resultChannel = data;
            setSelectedChannelId(data.id);
        }
      }

      if (resultChannel) {
        await refreshChannels(); // Easy way to sync state
      }
      console.log("Credentials saved");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectionTest = (result) => {
    if (!result) return;
    setIsConnected(!!result.success);
    if(result.success) {
        setChannelData(prev => ({...prev, lastSync: new Date().toISOString()}));
    }
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
        
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Channel Settings</h1>
              <p className="text-slate-500 text-sm mt-1">Manage your WhatsApp Business connection and templates.</p>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-slate-400"}`} />
                <span className="text-xs font-semibold text-slate-600">
                  {isConnected ? "System Online" : "Offline"}
                </span>
              </div>
              <UserProfileDropdown user={currentUser} onLogout={handleLogout} />
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* ERROR ALERT */}
          {loadError && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <Icon name="AlertTriangle" size={16} />
              <span>System Error: {loadError}</span>
            </div>
          )}

          {/* 1. CONNECTION HUB (Meta OAuth + Discover) */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Icon name="Facebook" size={20} className="text-blue-600" />
               Meta Connection Hub
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Connect Action */}
                <div className="p-5 bg-blue-50/50 rounded-lg border border-blue-100">
                    <h3 className="font-semibold text-slate-800 mb-1">1. Connect Account</h3>
                    <p className="text-xs text-slate-500 mb-4">Log in with Facebook to authorize permissions.</p>
                    <button
                        onClick={handleConnectWithMeta}
                        disabled={connectingOAuth}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-70"
                    >
                        {connectingOAuth ? <span className="animate-pulse">Connecting...</span> : "Connect with Facebook"}
                    </button>
                </div>

                {/* Discover Action */}
                <div className="p-5 bg-slate-50 rounded-lg border border-slate-100">
                     <h3 className="font-semibold text-slate-800 mb-1">2. Select Assets</h3>
                     <p className="text-xs text-slate-500 mb-4">Find your WABA and Phone Numbers.</p>
                     <button
                        onClick={handleDiscoverFromMeta}
                        disabled={discovering}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-all shadow-sm"
                     >
                        <Icon name="Search" size={16} />
                        {discovering ? "Searching..." : "Discover Accounts"}
                     </button>
                     {discoverError && <p className="text-xs text-red-500 mt-2">{discoverError}</p>}
                </div>
            </div>

            {/* Discovered Accounts List */}
            {wabas.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-6 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">Discovered Accounts</h4>
                    <div className="grid gap-3">
                        {wabas.map((waba) => (
                             <div key={waba.id} className="border border-slate-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-slate-800">{waba.name}</span>
                                    <span className="text-xs font-mono text-slate-400">ID: {waba.id}</span>
                                </div>
                                {waba.phone_numbers?.map((p) => (
                                    <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 rounded mt-2">
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{p.display_phone_number}</p>
                                            <p className="text-[10px] text-slate-400">{p.verified_name}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleConnectFromMeta(waba, p)}
                                            disabled={connectingNumberId === p.id}
                                            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {connectingNumberId === p.id ? "Linking..." : "Connect Number"}
                                        </button>
                                    </div>
                                ))}
                             </div>
                        ))}
                    </div>
                </div>
            )}
          </section>

          {/* 2. ACTIVE CHANNEL & TEMPLATES (The Core) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Col: Channel Selector & Status */}
            <div className="xl:col-span-1 space-y-6">
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

                {selectedChannelId && (
                     <ChannelStatusCard
                        isConnected={isConnected}
                        channelData={channelData}
                        onToggleChannel={handleToggleChannel}
                     />
                )}
            </div>

            {/* Right Col: Templates Manager (The MAIN thing for Meta) */}
            <div className="xl:col-span-2">
                {selectedChannelId ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">WhatsApp Templates</h2>
                             <button
                                onClick={async () => {
                                    await sync(selectedChannelId);
                                    await loadTemplatesForChannel(selectedChannelId);
                                }}
                                disabled={syncingTemplates}
                                className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800"
                             >
                                <Icon name="RefreshCw" size={14} className={syncingTemplates ? "animate-spin" : ""} />
                                {syncingTemplates ? "Syncing..." : "Sync from Meta"}
                             </button>
                        </div>
                        
                        <TemplatesListCard
                            templates={templates}
                            channelId={selectedChannelId}
                        />
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                        <Icon name="MessageSquare" size={32} className="mb-2 opacity-50" />
                        <p>Select a channel to view templates</p>
                    </div>
                )}
            </div>
          </div>

          {/* 3. ADVANCED SETTINGS (Manual Config) */}
          <div className="pt-8 border-t border-slate-200">
             <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                    <Icon name="Settings" size={16} />
                    <span>Advanced Configuration (Manual API Keys & Webhooks)</span>
                    <Icon name="ChevronDown" size={14} className="group-open:rotate-180 transition-transform" />
                </summary>
                
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                    <CredentialsForm
                        credentials={credentials}
                        onCredentialsChange={handleCredentialsChange}
                        onSave={handleSaveCredentials}
                        isLoading={isSaving}
                    />
                    <div className="space-y-6">
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

        </main>
      </div>
    </div>
  );
};

export default ChannelSetup;