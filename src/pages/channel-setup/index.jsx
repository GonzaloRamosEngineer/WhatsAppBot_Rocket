import React, { useState, useEffect } from "react";
import NavigationSidebar from "../../components/ui/NavigationSidebar";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import Icon from "../../components/AppIcon";
import CredentialsForm from "./components/CredentialsForm";
import ConnectionTestCard from "./components/ConnectionTestCard";
import WebhookConfigCard from "./components/WebhookConfigCard";
import ChannelStatusCard from "./components/ChannelStatusCard";
import TroubleshootingCard from "./components/TroubleshootingCard";

// Sesión + Supabase
import { useAuth } from "@/lib/AuthProvider";

const ChannelSetup = () => {
  const { profile, tenant, supabase, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  // Cargar canal desde Supabase + credenciales locales
  useEffect(() => {
    if (!supabase || !tenant?.id) return;

    const loadChannel = async () => {
      try {
        setLoadError(null);

        const { data, error } = await supabase
          .from("channels")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("type", "whatsapp")
          .maybeSingle();

        if (error) {
          console.error("[ChannelSetup] error loading channel", error);
          setLoadError(error.message);
        }

        const saved = localStorage.getItem("whatsapp_credentials");
        const savedCreds = saved ? JSON.parse(saved) : {};

        if (data) {
          setCredentials({
            phoneNumberId: data.phone_id || savedCreds.phoneNumberId || "",
            wabaId: data.meta_waba_id || savedCreds.wabaId || "",
            accessToken: savedCreds.accessToken || "",
            businessName:
              data.display_name ||
              savedCreds.businessName ||
              tenant?.name ||
              "Your Business",
          });

          setChannelData({
            businessName:
              data.display_name ||
              savedCreds.businessName ||
              tenant?.name ||
              "Your Business",
            phoneNumber: data.phone || null,
            phoneNumberId: data.phone_id || null,
            wabaId: data.meta_waba_id || null,
            isActive: data.status === "active",
            lastSync: data.created_at || new Date().toISOString(),
            stats: {
              messagesToday: 0,
              messagesThisMonth: 0,
              activeChats: 0,
            },
          });

          setIsConnected(
            !!data.status && data.status !== "disconnected"
          );
        } else if (
          savedCreds.phoneNumberId ||
          savedCreds.wabaId ||
          savedCreds.accessToken
        ) {
          // Sin canal en DB pero hay algo guardado en local → modo "semi-configurado"
          setCredentials({
            phoneNumberId: savedCreds.phoneNumberId || "",
            wabaId: savedCreds.wabaId || "",
            accessToken: savedCreds.accessToken || "",
            businessName:
              savedCreds.businessName ||
              tenant?.name ||
              "Your Business",
          });

          setChannelData({
            businessName:
              savedCreds.businessName ||
              tenant?.name ||
              "Your Business",
            phoneNumber: null,
            phoneNumberId: savedCreds.phoneNumberId || null,
            wabaId: savedCreds.wabaId || null,
            isActive: false,
            lastSync: new Date().toISOString(),
            stats: {
              messagesToday: 0,
              messagesThisMonth: 0,
              activeChats: 0,
            },
          });

          setIsConnected(true);
        } else {
          // Nada configurado aún
          setCredentials({
            phoneNumberId: "",
            wabaId: "",
            accessToken: "",
            businessName: tenant?.name || "Your Business",
          });
          setChannelData(null);
          setIsConnected(false);
        }
      } catch (e) {
        console.error(
          "[ChannelSetup] unexpected error loading channel",
          e
        );
        setLoadError(e.message);
      }
    };

    loadChannel();
  }, [supabase, tenant?.id]);

  const handleCredentialsChange = (newCredentials) => {
    setCredentials(newCredentials);
  };

  const handleSaveCredentials = async (credentialsData) => {
    if (!supabase || !tenant?.id) return;

    setIsSaving(true);
    try {
      // 1) Token y demás sensitive → solo localStorage
      localStorage.setItem(
        "whatsapp_credentials",
        JSON.stringify(credentialsData)
      );

      // 2) Upsert en channels
      const payload = {
        tenant_id: tenant.id,
        type: "whatsapp",
        display_name: credentialsData.businessName,
        phone_id: credentialsData.phoneNumberId,
        meta_waba_id: credentialsData.wabaId,
        status: channelData?.isActive ? "active" : "inactive",
      };

      const { data, error } = await supabase
        .from("channels")
        .upsert(payload, { onConflict: "tenant_id,type" })
        .select()
        .maybeSingle();

      if (error) {
        console.error(
          "[ChannelSetup] error saving channel",
          error
        );
      } else if (data) {
        setChannelData((prev) => ({
          ...(prev || {}),
          businessName: data.display_name,
          phoneNumberId: data.phone_id,
          wabaId: data.meta_waba_id,
        }));
      }

      console.log("Credentials saved successfully");
    } catch (error) {
      console.error("Failed to save credentials:", error);
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
        businessName:
          credentials.businessName ||
          tenant?.name ||
          "Your Business",
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
    setChannelData((prev) => ({
      ...prev,
      isActive,
      lastSync: new Date().toISOString(),
    }));

    if (!supabase || !tenant?.id) return;

    try {
      const { error } = await supabase
        .from("channels")
        .update({ status: isActive ? "active" : "inactive" })
        .eq("tenant_id", tenant.id)
        .eq("type", "whatsapp");

      if (error) {
        console.error(
          "[ChannelSetup] error updating channel status",
          error
        );
      }
    } catch (e) {
      console.error(
        "[ChannelSetup] unexpected error updating status",
        e
      );
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("whatsapp_credentials");
    await logout();
  };

  const currentUser = {
    name: tenant?.name || "Tenant",
    email:
      profile?.role === "tenant"
        ? "tenant@business.com"
        : "admin@whatsappbot.com",
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
        userRole="tenant"
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
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Channel Setup
              </h1>
              <p className="text-muted-foreground">
                Connect your WhatsApp Business account
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected
                      ? "bg-success"
                      : "bg-muted-foreground"
                  }`}
                />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? "Connected" : "Not Connected"}
                </span>
              </div>

              <UserProfileDropdown
                user={currentUser}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {loadError && (
            <div className="mb-4 p-4 border border-destructive rounded bg-destructive/10 text-destructive text-sm">
              Error loading channel: {loadError}
            </div>
          )}

          {/* Setup Progress Indicator */}
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
                {isConnected ? (
                  <Icon name="Check" size={16} />
                ) : (
                  "2"
                )}
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
              <span>Enter Credentials</span>
              <span>Test Connection</span>
              <span>Activate Channel</span>
            </div>
          </div>

          {/* Setup Cards Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <CredentialsForm
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

            {/* Right Column */}
            <div className="space-y-6">
              <ChannelStatusCard
                isConnected={isConnected}
                channelData={channelData}
                onToggleChannel={handleToggleChannel}
              />

              <WebhookConfigCard />
            </div>
          </div>

          {/* Troubleshooting Section */}
          <div className="mt-8">
            <TroubleshootingCard />
          </div>

          {/* Next Steps */}
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
                    Channel Setup Complete!
                  </h3>
                  <p className="text-success/80 mb-4">
                    Your WhatsApp Business account is now connected
                    and active. You can start building chatbot flows
                    and managing conversations.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/flow-builder"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-success text-success-foreground rounded-md hover:bg-success/90 micro-animation"
                    >
                      <Icon name="GitBranch" size={16} />
                      <span>Build Your First Flow</span>
                    </a>
                    <a
                      href="/messages-log"
                      className="inline-flex items-center space-x-2 px-4 py-2 border border-success text-success rounded-md hover:bg-success/10 micro-animation"
                    >
                      <Icon name="MessageCircle" size={16} />
                      <span>View Messages</span>
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
