// C:\Projects\WhatsAppBot_Rocket\src\pages\flow-builder\index.jsx

import React, { useState, useEffect } from "react";
import NavigationSidebar from "../../components/ui/NavigationSidebar";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import FlowCard from "./components/FlowCard";
import FlowEditor from "./components/FlowEditor";
import FlowPreview from "./components/FlowPreview";
import TemplateLibrary from "./components/TemplateLibrary";

// Hook global con supabase + tenant + profile
import { useAuth } from "@/lib/AuthProvider";

const RULES_KEY = "rules_v1";

const FlowBuilder = () => {
  const { supabase, tenant, profile } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);

  // Flujos en memoria (reglas)
  const [localFlows, setLocalFlows] = useState([]);

  // Fila de flows (key = 'rules_v1') asociada al bot
  const [rulesFlowRow, setRulesFlowRow] = useState(null);

  // Estado de carga / guardado / errores
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uiMessage, setUiMessage] = useState(null);
  const [uiError, setUiError] = useState(null);

  const handleToggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const handleLogout = () => console.log("Logging out...");
  const handleProfileClick = () => console.log("Opening profile...");

  // --------------------------------------------------
  //  Load: obtener bot + flow rules_v1 desde Supabase
  // --------------------------------------------------
  useEffect(() => {
    const loadRulesFlow = async () => {
      if (!supabase || !tenant) return;
      setIsLoading(true);
      setUiError(null);
      setUiMessage(null);

      try {
        // 1) Obtener bot principal del tenant (mismo criterio que webhook)
        const { data: bot, error: botError } = await supabase
          .from("bots")
          .select("id, name")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (botError) {
          console.error("[FlowBuilder] Error loading bot:", botError);
          setUiError("No se pudo cargar el bot del tenant.");
          setIsLoading(false);
          return;
        }

        if (!bot) {
          setUiError(
            "No hay ningún bot configurado para este tenant. Primero conectá un canal de WhatsApp."
          );
          setLocalFlows([]);
          setIsLoading(false);
          return;
        }

        // 2) Buscar flow con key = 'rules_v1'
        const { data: flowRow, error: flowError } = await supabase
          .from("flows")
          .select("id, bot_id, key, definition")
          .eq("bot_id", bot.id)
          .eq("key", RULES_KEY)
          .maybeSingle();

        if (flowError) {
          console.error("[FlowBuilder] Error loading rules_v1 flow:", flowError);
          setUiError("No se pudieron cargar las reglas del bot.");
          setIsLoading(false);
          return;
        }

        if (!flowRow) {
          // Aún no existe ningun flow de reglas → inicial vacío
          const def = { version: 1, engine: "rules_v1", rules: [] };
          setRulesFlowRow({
            id: null,
            bot_id: bot.id,
            key: RULES_KEY,
            definition: def,
          });
          setLocalFlows([]);
          setUiMessage(
            "Todavía no hay reglas configuradas. Creá tu primer flujo automático."
          );
        } else {
          setRulesFlowRow(flowRow);
          const def = flowRow.definition || {};
          setLocalFlows(def.rules || []);
        }

        setIsLoading(false);
      } catch (e) {
        console.error("[FlowBuilder] Unexpected error:", e);
        setUiError("Ocurrió un error inesperado al cargar las reglas.");
        setIsLoading(false);
      }
    };

    loadRulesFlow();
  }, [supabase, tenant]);

  // --------------------------------------------------
  //  Persistencia: guardar reglas en flows.definition
  // --------------------------------------------------
  const buildDefinitionFromLocalFlows = () => {
    return {
      version: 1,
      engine: "rules_v1",
      rules: localFlows,
    };
  };

  const handlePersistRules = async () => {
    if (!supabase || !rulesFlowRow) return;
    setIsSaving(true);
    setUiError(null);
    setUiMessage(null);

    try {
      const definition = buildDefinitionFromLocalFlows();

      if (rulesFlowRow.id) {
        // UPDATE existente
        const { error } = await supabase
          .from("flows")
          .update({ definition })
          .eq("id", rulesFlowRow.id);

        if (error) {
          console.error("[FlowBuilder] Error updating rules flow:", error);
          setUiError("No se pudieron guardar los cambios en las reglas.");
        } else {
          setUiMessage("Reglas guardadas correctamente.");
        }
      } else {
        // INSERT nuevo
        const { data, error } = await supabase
          .from("flows")
          .insert({
            bot_id: rulesFlowRow.bot_id,
            key: RULES_KEY,
            definition,
          })
          .select()
          .single();

        if (error) {
          console.error("[FlowBuilder] Error inserting rules flow:", error);
          setUiError("No se pudieron crear las reglas.");
        } else {
          setRulesFlowRow(data);
          setUiMessage("Reglas creadas y guardadas correctamente.");
        }
      }
    } catch (e) {
      console.error("[FlowBuilder] Unexpected error on save:", e);
      setUiError("Ocurrió un error inesperado al guardar las reglas.");
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------
  //  Eventos UI de flujos (en memoria)
  // --------------------------------------------------
  const handleCreateFlow = () => {
    setSelectedFlow(null);
    setIsEditorOpen(true);
  };

  const handleEditFlow = (flow) => {
    setSelectedFlow(flow);
    setIsEditorOpen(true);
  };

  const handleDeleteFlow = (flowId) => {
    if (window.confirm("¿Seguro que querés eliminar este flujo?")) {
      setLocalFlows((prev) => prev.filter((flow) => flow.id !== flowId));
      setUiMessage("Flujo eliminado. No olvides guardar las reglas.");
    }
  };

  const handleToggleFlow = (flowId) => {
    setLocalFlows((prev) =>
      prev.map((flow) =>
        flow.id === flowId ? { ...flow, isActive: !flow.isActive } : flow
      )
    );
    setUiMessage("Estado del flujo actualizado. No olvides guardar las reglas.");
  };

  const handlePreviewFlow = (flow) => {
    setSelectedFlow(flow);
    setIsPreviewOpen(true);
  };

  const handleSaveFlow = (flowData) => {
    // FlowEditor ya arma id, triggerCount, lastUpdated
    setLocalFlows((prev) => {
      if (selectedFlow) {
        // update
        return prev.map((flow) =>
          flow.id === selectedFlow.id ? flowData : flow
        );
      } else {
        // create
        return [flowData, ...prev];
      }
    });

    setIsEditorOpen(false);
    setSelectedFlow(null);
    setUiMessage(
      "Flujo actualizado en borrador. No olvides guardar las reglas."
    );
  };

  const handleSelectTemplate = (templateData) => {
    setLocalFlows((prev) => [templateData, ...prev]);
    setUiMessage("Plantilla agregada. No olvides guardar las reglas.");
  };

  // --------------------------------------------------
  //  Filtros + stats
  // --------------------------------------------------
  const filteredFlows = localFlows.filter((flow) => {
    const matchesSearch =
      flow.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flow.keywords &&
        flow.keywords.some((keyword) =>
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        ));

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && flow.isActive) ||
      (filterStatus === "inactive" && !flow.isActive);

    return matchesSearch && matchesFilter;
  });

  const getFlowStats = () => {
    const totalFlows = localFlows.length;
    const activeFlows = localFlows.filter((f) => f.isActive).length;
    const totalTriggers = localFlows.reduce(
      (sum, f) => sum + (f.triggerCount || 0),
      0
    );
    return { totalFlows, activeFlows, totalTriggers };
  };

  const stats = getFlowStats();

  const currentUser = {
    name: tenant?.name || "Tenant",
    email:
      profile?.role === "tenant"
        ? "tenant@business.com"
        : "admin@whatsappbot.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150",
    role: profile?.role || "tenant",
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleToggleSidebar}
        userRole="tenant"
      />

      <div
        className={`transition-all duration-200 ${
          isSidebarCollapsed ? "md:ml-16" : "md:ml-60"
        }`}
      >
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Flow Builder
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Diseñá y administrá las respuestas automáticas de tu bot
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                iconName="Save"
                iconPosition="left"
                onClick={handlePersistRules}
                disabled={isSaving || isLoading || !tenant}
              >
                {isSaving ? "Guardando..." : "Guardar reglas"}
              </Button>

              <UserProfileDropdown
                user={currentUser}
                onLogout={handleLogout}
                onProfileClick={handleProfileClick}
              />
            </div>
          </div>
        </header>

        {/* Mensajes de estado */}
        <div className="px-6 pt-4">
          {isLoading && (
            <div className="mb-4 rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">
              Cargando reglas del bot…
            </div>
          )}
          {uiError && (
            <div className="mb-4 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {uiError}
            </div>
          )}
          {uiMessage && !uiError && (
            <div className="mb-4 rounded-md bg-emerald-500/10 px-4 py-2 text-sm text-emerald-500">
              {uiMessage}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name="GitBranch" size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {stats.totalFlows}
                  </p>
                  <p className="text-sm text-muted-foreground">Flujos totales</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle" size={24} className="text-success" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {stats.activeFlows}
                  </p>
                  <p className="text-sm text-muted-foreground">Flujos activos</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Icon name="Zap" size={24} className="text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {stats.totalTriggers.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Disparos totales
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Input
                placeholder="Buscar flows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">Todos los flujos</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                iconName="BookOpen"
                iconPosition="left"
                onClick={() => setIsTemplateLibraryOpen(true)}
              >
                Plantillas
              </Button>
              <Button
                variant="default"
                iconName="Plus"
                iconPosition="left"
                onClick={handleCreateFlow}
                disabled={!tenant || isLoading}
              >
                Crear flujo
              </Button>
            </div>
          </div>

          {/* Flows Grid */}
          {filteredFlows.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredFlows.map((flow) => (
                <FlowCard
                  key={flow.id}
                  flow={flow}
                  onEdit={handleEditFlow}
                  onToggle={handleToggleFlow}
                  onDelete={handleDeleteFlow}
                  onPreview={handlePreviewFlow}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon
                  name="GitBranch"
                  size={32}
                  className="text-muted-foreground"
                />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "No se encontraron flujos"
                  : "Todavía no creaste flujos"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? "Probá cambiando el criterio de búsqueda o los filtros."
                  : "Creá tu primer flujo automático para empezar a responder en WhatsApp."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    variant="outline"
                    iconName="BookOpen"
                    iconPosition="left"
                    onClick={() => setIsTemplateLibraryOpen(true)}
                  >
                    Ver plantillas
                  </Button>
                  <Button
                    variant="default"
                    iconName="Plus"
                    iconPosition="left"
                    onClick={handleCreateFlow}
                    disabled={!tenant || isLoading}
                  >
                    Crear flujo
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FlowEditor
        flow={selectedFlow}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedFlow(null);
        }}
        onSave={handleSaveFlow}
      />
      <FlowPreview
        flow={selectedFlow}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedFlow(null);
        }}
      />
      <TemplateLibrary
        isOpen={isTemplateLibraryOpen}
        onClose={() => setIsTemplateLibraryOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
};

export default FlowBuilder;
