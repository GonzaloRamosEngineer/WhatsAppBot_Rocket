// C:\Projects\WhatsAppBot_Rocket\src\pages\channel-setup\index.jsx

import React, { useState, useEffect } from "react";
import NavigationSidebar from "../../components/ui/NavigationSidebar";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import Icon from "../../components/AppIcon";

import CredentialsForm from "./components/CredentialsForm";
import ConnectionTestCard from "./components/ConnectionTestCard";
import WebhookConfigCard from "./components/WebhookConfigCard";
import ChannelStatusCard from "./components/ChannelStatusCard";
import TroubleshootingCard from "./components/TroubleshootingCard";
import ChannelSelector from "./components/ChannelSelector";

// Sesión + Supabase
import { useAuth } from "@/lib/AuthProvider";
// Hook de sync de plantillas
import { useSyncTemplates } from "@/lib/useSyncTemplates";
// Tabla simple de plantillas
import TemplatesListCard from "./components/TemplatesListCard";

const ChannelSetup = () => {
  const { profile, tenant, supabase, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 🔌 estado para el botón "Conectar con Meta"
  const [connecting, setConnecting] = useState(false);

  // Lista de canales WhatsApp del tenant
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState(null); // null = nuevo canal

  // Credenciales del formulario (modo manual / avanzado)
  const [credentials, setCredentials] = useState({
    phoneNumberId: "",
    wabaId: "",
    accessToken: "",
    businessName: "",
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [channelData, setChannelData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // 📄 Plantillas Meta del canal seleccionado
  const [templates, setTemplates] = useState([]);

  // ⚙️ Hook de sincronización de plantillas (Edge Function whatsapp-sync-templates)
  const {
    loading: syncingTemplates,
    result: syncResult, // por ahora solo log; a futuro puede alimentar toasts
    sync,
  } = useSyncTemplates();

  // 🔐 Helper localStorage (un solo set por tenant, sirve para todos los canales)
  const loadLocalCredentials = () => {
    const saved = localStorage.getItem("whatsapp_credentials");
    return saved ? JSON.parse(saved) : {};
  };

  const saveLocalCredentials = (credentialsData) => {
    localStorage.setItem(
      "whatsapp_credentials",
      JSON.stringify(credentialsData)
    );
  };

  // 🧾 Cargar plantillas para un canal
  const loadTemplatesForChannel = async (channelId) => {
    if (!supabase || !channelId) {
      setTemplates([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("templates")
        .select(
          "id, name, language, category, status, body, last_synced_at"
        )
        .eq("channel_id", channelId)
        .order("last_synced_at", { ascending: false });

      if (error) {
        console.error("[ChannelSetup] error cargando templates", error);
        setTemplates([]);
        return;
      }

      setTemplates(data || []);
    } catch (e) {
      console.error("[ChannelSetup] error inesperado cargando templates", e);
      setTemplates([]);
    }
  };

  // 🧠 Cargar canales + seleccionar uno inicial
  useEffect(() => {
    if (!supabase || !tenant?.id) return;

    const loadChannels = async () => {
      try {
        setLoadError(null);

        const { data, error } = await supabase
          .from("channels")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("type", "whatsapp")
          .order("created_at", { ascending: true });

        if (error) {
          console.error("[ChannelSetup] error cargando canales", error);
          setLoadError(error.message);
          setChannels([]);
          setSelectedChannelId(null);
          setChannelData(null);
          setIsConnected(false);
          setTemplates([]);
          return;
        }

        const list = data || [];
        setChannels(list);

        const savedCreds = loadLocalCredentials();

        if (list.length > 0) {
          // Elegimos el canal activo; si no hay, el primero
          const active =
            list.find((c) => c.status === "active") || list[0];

          setSelectedChannelId(active.id);
          // Guardamos canal activo para otras vistas (Blueprints)
          localStorage.setItem("activeChannel", active.id);

          // Armamos credenciales mezclando DB + localStorage
          setCredentials({
            phoneNumberId:
              active.phone_id || savedCreds.phoneNumberId || "",
            wabaId: active.meta_waba_id || savedCreds.wabaId || "",
            accessToken: savedCreds.accessToken || "",
            businessName:
              active.display_name ||
              savedCreds.businessName ||
              tenant?.name ||
              "Tu negocio",
          });

          // ⚙️ channelData con channelId incluido
          setChannelData({
            channelId: active.id,
            businessName:
              active.display_name ||
              savedCreds.businessName ||
              tenant?.name ||
              "Tu negocio",
            phoneNumber: active.phone || null,
            phoneNumberId: active.phone_id || null,
            wabaId: active.meta_waba_id || null,
            isActive: active.status === "active",
            lastSync: active.created_at || new Date().toISOString(),
            stats: {
              messagesToday: 0,
              messagesThisMonth: 0,
              activeChats: 0,
            },
          });

          setIsConnected(
            !!active.status && active.status !== "disconnected"
          );

          // 🧾 cargar plantillas de este canal
          await loadTemplatesForChannel(active.id);
        } else {
          // Sin canales todavía → modo "nuevo canal"
          setSelectedChannelId(null);
          localStorage.removeItem("activeChannel");

          setCredentials({
            phoneNumberId: "",
            wabaId: "",
            accessToken: "",
            businessName: tenant?.name || "Tu negocio",
          });
          setChannelData(null);
          setIsConnected(false);
          setTemplates([]);
        }
      } catch (e) {
        console.error(
          "[ChannelSetup] error inesperado cargando canales",
          e
        );
        setLoadError(e.message);
        setChannels([]);
        setSelectedChannelId(null);
        setChannelData(null);
        setIsConnected(false);
        setTemplates([]);
      }
    };

    loadChannels();
  }, [supabase, tenant?.id]);

  // 📨 Listener del popup OAuth (éxito / error)
  useEffect(() => {
    const handler = (event) => {
      // Solo aceptamos mensajes del mismo origen
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "facebook_oauth_success") {
        console.log(
          "[ChannelSetup] OAuth Meta completado, recargando canales..."
        );
        // Lo más simple: recargar la página completa
        window.location.reload();
      }

      if (event.data?.type === "facebook_oauth_error") {
        console.error(
          "[ChannelSetup] error en OAuth Meta",
          event.data.error
        );
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Cambio de canal seleccionado desde el selector
  const handleSelectChannel = (channelId) => {
    setSelectedChannelId(channelId);

    const savedCreds = loadLocalCredentials();

    // Actualizamos canal activo global (para Blueprints / otras vistas)
    if (channelId) {
      localStorage.setItem("activeChannel", channelId);
    } else {
      localStorage.removeItem("activeChannel");
    }

    if (!channelId) {
      // Nuevo canal
      setCredentials({
        phoneNumberId: "",
        wabaId: "",
        accessToken: savedCreds.accessToken || "",
        businessName:
          savedCreds.businessName || tenant?.name || "Tu negocio",
      });
      setChannelData(null);
      setIsConnected(false);
      setTemplates([]);
      return;
    }

    const channel = channels.find((c) => c.id === channelId);
    if (!channel) return;

    setCredentials({
      phoneNumberId:
        channel.phone_id || savedCreds.phoneNumberId || "",
      wabaId: channel.meta_waba_id || savedCreds.wabaId || "",
      accessToken: savedCreds.accessToken || "",
      businessName:
        channel.display_name ||
        savedCreds.businessName ||
        tenant?.name ||
        "Tu negocio",
    });

    // ⚙️ channelData con channelId incluido
    setChannelData({
      channelId: channel.id,
      businessName:
        channel.display_name ||
        savedCreds.businessName ||
        tenant?.name ||
        "Tu negocio",
      phoneNumber: channel.phone || null,
      phoneNumberId: channel.phone_id || null,
      wabaId: channel.meta_waba_id || null,
      isActive: channel.status === "active",
      lastSync: channel.created_at || new Date().toISOString(),
      stats: {
        messagesToday: 0,
        messagesThisMonth: 0,
        activeChats: 0,
      },
    });

    setIsConnected(
      !!channel.status && channel.status !== "disconnected"
    );

    // 🧾 cargar plantillas del nuevo canal
    loadTemplatesForChannel(channelId);
  };

  const handleCredentialsChange = (newCredentials) => {
    setCredentials(newCredentials);
  };

  // 💾 Guardar credenciales + persistir canal (modo manual)
  const handleSaveCredentials = async (credentialsData) => {
    if (!supabase || !tenant?.id) return;

    setIsSaving(true);
    try {
      // 1) Token y datos sensibles → solo localStorage
      saveLocalCredentials(credentialsData);

      // 2) Insert / update en channels
      const payload = {
        display_name: credentialsData.businessName,
        phone_id: credentialsData.phoneNumberId,
        meta_waba_id: credentialsData.wabaId,
      };

      let resultChannel = null;

      if (selectedChannelId) {
        // Actualizar canal existente
        const { data, error } = await supabase
          .from("channels")
          .update(payload)
          .eq("id", selectedChannelId)
          .select()
          .single();

        if (error) {
          console.error(
            "[ChannelSetup] error actualizando canal",
            error
          );
        } else {
          resultChannel = data;
        }
      } else {
        // Crear nuevo canal para este tenant
        const { data, error } = await supabase
          .from("channels")
          .insert({
            tenant_id: tenant.id,
            type: "whatsapp",
            status: "inactive",
            phone: null,
            token_alias: null,
            ...payload,
          })
          .select()
          .single();

        if (error) {
          console.error(
            "[ChannelSetup] error creando canal",
            error
          );
        } else {
          resultChannel = data;
          setSelectedChannelId(data.id);
          localStorage.setItem("activeChannel", data.id);
        }
      }

      if (resultChannel) {
        // Actualizar lista de canales en memoria
        setChannels((prev) => {
          const exists = prev.some((c) => c.id === resultChannel.id);
          if (exists) {
            return prev.map((c) =>
              c.id === resultChannel.id ? resultChannel : c
            );
          }
          return [...prev, resultChannel];
        });

        // ⚙️ Actualizar datos del canal seleccionado (incluyendo channelId)
        setChannelData((prev) => ({
          ...(prev || {}),
          channelId: resultChannel.id,
          businessName: resultChannel.display_name,
          phoneNumber:
            resultChannel.phone || prev?.phoneNumber || null,
          phoneNumberId: resultChannel.phone_id,
          wabaId: resultChannel.meta_waba_id,
          isActive: resultChannel.status === "active",
          lastSync: new Date().toISOString(),
          stats:
            prev?.stats || {
              messagesToday: 0,
              messagesThisMonth: 0,
              activeChats: 0,
            },
        }));

        // No recargamos plantillas acá porque todavía no se conectó a Meta;
        // el botón de "Sincronizar" se encargará de traerlas.
      }

      console.log("[ChannelSetup] Credenciales guardadas correctamente");
    } catch (error) {
      console.error(
        "[ChannelSetup] error al guardar credenciales",
        error
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Recibe el resultado del ConnectionTestCard
  const handleConnectionTest = (result) => {
    if (!result) return;

    const success = !!result.success;
    const phoneNumber =
      result.details?.phoneNumber ||
      channelData?.phoneNumber ||
      "+0 000 000 000";

    if (success) {
      setIsConnected(true);
      setChannelData((prev) => ({
        ...(prev || {}),
        // 🧩 preservamos channelId, o usamos el seleccionado
        channelId: prev?.channelId || selectedChannelId || null,
        businessName:
          credentials.businessName || tenant?.name || "Tu negocio",
        phoneNumber,
        phoneNumberId:
          credentials.phoneNumberId || prev?.phoneNumberId || null,
        wabaId: credentials.wabaId || prev?.wabaId || null,
        isActive: prev?.isActive ?? false,
        lastSync: new Date().toISOString(),
        stats:
          prev?.stats || {
            messagesToday: 0,
            messagesThisMonth: 0,
            activeChats: 0,
          },
      }));
    } else {
      setIsConnected(false);
      // dejamos channelData para que el usuario no pierda info visual
    }
  };

  const handleToggleChannel = async (isActive) => {
    // 🧩 acá preservamos channelId y resto de campos
    setChannelData((prev) => ({
      ...prev,
      isActive,
      lastSync: new Date().toISOString(),
    }));

    if (!supabase || !tenant?.id || !selectedChannelId) return;

    try {
      const { data, error } = await supabase
        .from("channels")
        .update({ status: isActive ? "active" : "inactive" })
        .eq("id", selectedChannelId)
        .select()
        .single();

      if (error) {
        console.error(
          "[ChannelSetup] error actualizando estado",
          error
        );
        return;
      }

      // Actualizar lista en memoria
      setChannels((prev) =>
        prev.map((c) => (c.id === data.id ? data : c))
      );
    } catch (e) {
      console.error(
        "[ChannelSetup] error inesperado actualizando estado",
        e
      );
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("whatsapp_credentials");
    await logout();
  };

  // 🔌 Botón "Conectar con Meta (Facebook)" → crea oauth_state y abre popup (login estándar con scopes)
  const handleConnectWithMeta = async () => {
    try {
      if (!supabase || !tenant?.id) {
        console.error(
          "[ChannelSetup] falta supabase o tenant para OAuth",
          {
            hasSupabase: !!supabase,
            tenantId: tenant?.id,
          }
        );
        alert(
          "No se pudo preparar la conexión con Meta. Falta información del tenant."
        );
        return;
      }

      setConnecting(true);

      // 1) Obtener el usuario actual desde Supabase Auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error(
          "[ChannelSetup] no se pudo obtener el usuario de Supabase Auth",
          userError
        );
        alert(
          "No se pudo preparar la conexión con Meta. No se encontró el usuario."
        );
        return;
      }

      const userId = user.id;

      // 2) Crear registro en oauth_states
      const { data, error } = await supabase
        .from("oauth_states")
        .insert({
          tenant_id: tenant.id,
          user_id: userId,
          provider: "facebook",
          redirect_to: window.location.href,
        })
        .select()
        .single();

      if (error || !data) {
        console.error(
          "[ChannelSetup] error creando oauth_state",
          error
        );
        alert(
          "No se pudo preparar la conexión con Meta. Error creando el estado OAuth."
        );
        return;
      }

      const stateId = data.id;

      const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
      const redirectUri = import.meta.env.VITE_FACEBOOK_REDIRECT_URI;

      if (!appId || !redirectUri) {
        console.error(
          "[ChannelSetup] faltan VITE_FACEBOOK_APP_ID o VITE_FACEBOOK_REDIRECT_URI"
        );
        alert("Faltan variables de entorno para conectar con Meta.");
        return;
      }

      // 3) SCOPES CLÁSICOS
      const scopes = [
        "public_profile",
        "email",
        "business_management",
        "whatsapp_business_management",
        "whatsapp_business_messaging",
      ].join(",");

      const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        state: stateId,
        scope: scopes,
        response_type: "code",
        auth_type: "rerequest",
      });

      const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;

      // 4) Abrir popup
      const width = 600;
      const height = 800;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      window.open(
        oauthUrl,
        "facebook_oauth_popup",
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (err) {
      console.error("[ChannelSetup] handleConnectWithMeta error:", err);
      alert("Error preparando la conexión con Meta.");
    } finally {
      setConnecting(false);
    }
  };

  const currentUser = {
    name: tenant?.name || "Tenant",
    email:
      profile?.role === "tenant"
        ? "tenant@business.com"
        : "admin@whatsappbot.com",
    avatar: null,
    role: profile?.role || "tenant",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Barra lateral */}
      <NavigationSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole="tenant"
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
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Configuración de canales
              </h1>
              <p className="text-muted-foreground">
                Conectá tus números de WhatsApp Business a DigitalMatch
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Indicador de conexión */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-success" : "bg-muted-foreground"
                  }`}
                />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? "Conectado" : "No conectado"}
                </span>
              </div>

              <UserProfileDropdown
                user={currentUser}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="p-6">
          {loadError && (
            <div className="mb-4 p-4 border border-destructive rounded bg-destructive/10 text-destructive text-sm">
              Error al cargar los canales: {loadError}
            </div>
          )}

          {/* 🔥 Card Modo Wasapi / OAuth */}
          <div className="mb-6">
            <div className="bg-card border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="Globe2" size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Conectá automáticamente con Meta (recomendado)
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Usá el flujo oficial de Meta para seleccionar tu número
                    de WhatsApp Business sin copiar tokens ni IDs a mano.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConnectWithMeta}
                disabled={connecting}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 micro-animation disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Icon name="Zap" size={16} className="mr-2" />
                {connecting
                  ? "Preparando conexión..."
                  : "Conectar con Meta (Facebook)"}
              </button>
            </div>
          </div>

          {/* Selector de canal */}
          <div className="mb-6">
            <ChannelSelector
              channels={channels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={handleSelectChannel}
            />
          </div>

          {/* 🌐 Sincronización de plantillas Meta */}
          {selectedChannelId && (
            <div className="mb-6 bg-card border border-border rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Plantillas de WhatsApp Business (Meta)
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Sincronizá las plantillas aprobadas en tu cuenta de Meta
                    para usarlas en flujos y campañas desde DigitalMatch.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!selectedChannelId || syncingTemplates}
                  onClick={async () => {
                    const res = await sync(selectedChannelId);
                    console.log(
                      "[ChannelSetup] resultado sync templates",
                      res
                    );
                    await loadTemplatesForChannel(selectedChannelId);
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 micro-animation disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Icon name="RefreshCw" size={16} className="mr-2" />
                  {syncingTemplates
                    ? "Sincronizando..."
                    : "Sincronizar plantillas"}
                </button>
              </div>

              {templates.length > 0 ? (
                <TemplatesListCard templates={templates} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  No se encontraron plantillas para este canal. Probá
                  sincronizar desde Meta.
                </p>
              )}
            </div>
          )}

          {/* Indicador de pasos */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  credentials?.phoneNumberId &&
                  credentials?.wabaId &&
                  credentials?.accessToken
                    ? "bg-success text-success-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {credentials?.phoneNumberId &&
                credentials?.wabaId &&
                credentials?.accessToken ? (
                  <Icon name="Check" size={16} />
                ) : (
                  "1"
                )}
              </div>
              <div className="flex-1 h-px bg-border" />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isConnected
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isConnected ? <Icon name="Check" size={16} /> : "2"}
              </div>
              <div className="flex-1 h-px bg-border" />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  channelData?.isActive
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {channelData?.isActive ? (
                  <Icon name="Check" size={16} />
                ) : (
                  "3"
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Ingresar credenciales</span>
              <span>Probar conexión</span>
              <span>Activar canal</span>
            </div>
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-6">
              <CredentialsForm
                credentials={credentials}
                onCredentialsChange={handleCredentialsChange}
                onSave={handleSaveCredentials}
                isLoading={isSaving}
              />

              <ConnectionTestCard
                credentials={credentials}
                onTestConnection={handleConnectionTest}
                isConnected={isConnected}
              />
            </div>

            {/* Columna derecha */}
            <div className="space-y-6">
              <ChannelStatusCard
                isConnected={isConnected}
                channelData={channelData}
                onToggleChannel={handleToggleChannel}
              />

              <WebhookConfigCard />
            </div>
          </div>

          {/* Sección de ayuda */}
          <div className="mt-8">
            <TroubleshootingCard />
          </div>

          {/* Mensaje de éxito final */}
          {isConnected && channelData?.isActive && (
            <div className="mt-8 p-6 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Icon
                  name="CheckCircle"
                  size={24}
                  className="text-success flex-shrink-0 mt-1"
                />
                <div>
                  <h3 className="text-lg font-semibold text-success mb-2">
                    ¡Canal configurado correctamente!
                  </h3>
                  <p className="text-success/80 mb-4">
                    Tu número de WhatsApp Business ya está conectado y
                    activo. Ahora podés empezar a construir flujos de
                    chatbot y gestionar conversaciones desde DigitalMatch.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/flow-builder"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-success text-success-foreground rounded-md hover:bg-success/90 micro-animation"
                    >
                      <Icon name="GitBranch" size={16} />
                      <span>Crear tu primer flujo</span>
                    </a>
                    <a
                      href="/messages-log"
                      className="inline-flex items-center space-x-2 px-4 py-2 border border-success text-success rounded-md hover:bg-success/10 micro-animation"
                    >
                      <Icon name="MessageCircle" size={16} />
                      <span>Ver mensajes</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChannelSetup;
