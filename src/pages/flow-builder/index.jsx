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

// 👇 NUEVO: import del modal Blueprint Meta
// import MetaTemplateBlueprints from "./components/MetaTemplateBlueprints";

// Hook global
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

  // 👇 NUEVO: estado para el modal Blueprints
  //const [showMetaBlueprints, setShowMetaBlueprints] = useState(false);

  // flows en memoria
  const [localFlows, setLocalFlows] = useState([]);
  const [rulesFlowRow, setRulesFlowRow] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uiMessage, setUiMessage] = useState(null);
  const [uiError, setUiError] = useState(null);

  const handleToggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const handleLogout = () => console.log("Logging out...");
  const handleProfileClick = () => console.log("Opening profile...");

  // --------------------------------------------------
  //     Load flows del tenant (tabla flows)
  // --------------------------------------------------
  useEffect(() => {
    const loadRulesFlow = async () => {
      if (!supabase || !tenant?.id) return;
      setIsLoading(true);
      setUiError(null);
      setUiMessage(null);

      try {
        const { data: bot } = await supabase
          .from("bots")
          .select("id, name")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!bot) {
          setUiError("No hay ningún bot configurado para este tenant.");
          setLocalFlows([]);
          setIsLoading(false);
          return;
        }

        const { data: flowRow } = await supabase
          .from("flows")
          .select("id, bot_id, key, definition")
          .eq("bot_id", bot.id)
          .eq("key", RULES_KEY)
          .maybeSingle();

        if (!flowRow) {
          const def = { version: 1, engine: "rules_v1", rules: [] };
          setRulesFlowRow({
            id: null,
            bot_id: bot.id,
            key: RULES_KEY,
            definition: def
          });
          setLocalFlows([]);
        } else {
          const def = flowRow.definition || {};
          const rules = Array.isArray(def.rules) ? def.rules : [];
          setRulesFlowRow({
            ...flowRow,
            definition: {
              version: def.version || 1,
              engine: def.engine || "rules_v1",
              rules
            }
          });
          setLocalFlows(rules);
        }

        setIsLoading(false);
      } catch (e) {
        console.error("[FlowBuilder] error:", e);
        setUiError("Error inesperado al cargar las reglas.");
        setIsLoading(false);
      }
    };

    loadRulesFlow();
  }, [supabase, tenant?.id]);

  // --------------------------------------------------
  //   Guardar (insert/update) reglas en DB
  // --------------------------------------------------
  const buildDefinitionFromLocalFlows = () => ({
    version: 1,
    engine: "rules_v1",
    rules: localFlows
  });

  const handlePersistRules = async () => {
    if (!supabase || !rulesFlowRow) return;
    setIsSaving(true);
    setUiError(null);
    setUiMessage(null);

    try {
      const definition = buildDefinitionFromLocalFlows();

      if (rulesFlowRow.id) {
        const { error } = await supabase
          .from("flows")
          .update({ definition })
          .eq("id", rulesFlowRow.id);

        if (error) {
          setUiError("No se pudieron guardar las reglas.");
        } else {
          setUiMessage("Reglas guardadas correctamente.");
        }
      } else {
        const { data, error } = await supabase
          .from("flows")
          .insert({
            bot_id: rulesFlowRow.bot_id,
            key: RULES_KEY,
            definition
          })
          .select()
          .single();

        if (error) {
          setUiError("Error creando las reglas.");
        } else {
          setRulesFlowRow(data);
          setUiMessage("Reglas creadas correctamente.");
        }
      }
    } catch (e) {
      setUiError("Error inesperado al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------
  //        Eventos UI de flows
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
      setLocalFlows((prev) => prev.filter((f) => f.id !== flowId));
      setUiMessage("Flujo eliminado.");
    }
  };

  const handleToggleFlow = (flowId) => {
    setLocalFlows((prev) => {
      const updated = prev.map((flow) =>
        flow.id === flowId ? { ...flow, isActive: !flow.isActive } : flow
      );

      const toggled = updated.find((f) => f.id === flowId);

      if (
        toggled &&
        toggled.isActive &&
        (toggled.triggerType === "welcome" ||
          toggled.triggerType === "fallback")
      ) {
        return updated.map((f) =>
          f.id !== toggled.id && f.triggerType === toggled.triggerType
            ? { ...f, isActive: false }
            : f
        );
      }

      return updated;
    });
  };

  const handlePreviewFlow = (flow) => {
    setSelectedFlow(flow);
    setIsPreviewOpen(true);
  };

  const handleSaveFlow = (flowData) => {
    setLocalFlows((prev) => {
      let next;

      if (selectedFlow) {
        next = prev.map((f) => (f.id === selectedFlow.id ? flowData : f));
      } else {
        next = [flowData, ...prev];
      }

      if (
        flowData.isActive &&
        (flowData.triggerType === "welcome" ||
          flowData.triggerType === "fallback")
      ) {
        next = next.map((f) =>
          f.id !== flowData.id && f.triggerType === flowData.triggerType
            ? { ...f, isActive: false }
            : f
        );
      }

      return next;
    });

    setIsEditorOpen(false);
    setSelectedFlow(null);
    setUiMessage("Flujo actualizado en borrador.");
  };

  const handleSelectTemplate = (templateData) => {
    setLocalFlows((prev) => {
      let next = [templateData, ...prev];

      if (
        templateData.isActive &&
        (templateData.triggerType === "welcome" ||
          templateData.triggerType === "fallback")
      ) {
        next = next.map((f) =>
          f.id !== templateData.id &&
          f.triggerType === templateData.triggerType
            ? { ...f, isActive: false }
            : f
        );
      }

      return next;
    });

    setUiMessage("Plantilla agregada. No olvides guardar.");
  };

  // --------------------------------------------------
  //  Filtros + stats
  // --------------------------------------------------
  const filteredFlows = localFlows.filter((flow) => {
    const matchesSearch =
      flow.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flow.keywords &&
        flow.keywords.some((kw) =>
          kw.toLowerCase().includes(searchTerm.toLowerCase())
        ));

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && flow.isActive) ||
      (filterStatus === "inactive" && !flow.isActive);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalFlows: localFlows.length,
    activeFlows: localFlows.filter((f) => f.isActive).length,
    totalTriggers: localFlows.reduce(
      (sum, f) => sum + (f.triggerCount || 0),
      0
    )
  };

  // --------------------------------------------------
  //  Usuario actual (para el dropdown)
  // --------------------------------------------------
  const currentUser = {
    name: tenant?.name || "Tenant",
    email:
      profile?.role === "tenant"
        ? "tenant@business.com"
        : "admin@whatsappbot.com",
    avatar: null,
    role: profile?.role || "tenant"
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
{/* Header - Flow Builder */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="bg-purple-600 p-2 rounded-lg text-white shadow-sm">
                  <Icon name="GitBranch" size={20} />
               </div>
               <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Flow Builder</h1>
                  <p className="text-slate-500 text-xs font-medium">
                    Design and manage automated bot responses
                  </p>
               </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                iconName="Save"
                onClick={handlePersistRules}
                disabled={isSaving || isLoading}
                className="border-slate-300 hover:border-purple-500 hover:text-purple-600"
              >
                {isSaving ? "Saving..." : "Save Rules"}
              </Button>

              <UserProfileDropdown
                user={currentUser}
                onLogout={handleLogout}
                onProfileClick={handleProfileClick}
              />
            </div>
          </div>
        </header>

        {/* Mensajes UI */}
        <div className="px-6 pt-4">
          {isLoading && (
            <div className="mb-4 rounded bg-muted px-4 py-2 text-sm">
              Cargando reglas…
            </div>
          )}
          {uiError && (
            <div className="mb-4 rounded bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {uiError}
            </div>
          )}
          {uiMessage && !uiError && (
            <div className="mb-4 rounded bg-emerald-500/10 px-4 py-2 text-sm text-emerald-500">
              {uiMessage}
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <Icon name="GitBranch" className="text-primary" size={24} />
                <div>
                  <p className="text-2xl font-semibold">{stats.totalFlows}</p>
                  <p className="text-sm text-muted-foreground">Flujos totales</p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <Icon name="CheckCircle" className="text-success" size={24} />
                <div>
                  <p className="text-2xl font-semibold">{stats.activeFlows}</p>
                  <p className="text-sm text-muted-foreground">Activos</p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <Icon name="Zap" className="text-secondary" size={24} />
                <div>
                  <p className="text-2xl font-semibold">
                    {stats.totalTriggers.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Disparos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros + botones */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Buscar flows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md bg-card"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                iconName="BookOpen"
                onClick={() => setIsTemplateLibraryOpen(true)}
              >
                Plantillas
              </Button>

              {/*  NUEVO BOTÓN DE BLUEPRINTS META  */}
              {/* <Button
                variant="outline"
                iconName="Layers"
                onClick={() => setShowMetaBlueprints(true)}
              >
                Plantillas Meta
              </Button> */}

              <Button
                variant="default"
                iconName="Plus"
                onClick={handleCreateFlow}
              >
                Crear flujo
              </Button>
            </div>
          </div>

          {/* Flujos */}
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
              <Icon name="GitBranch" size={32} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No se encontraron flujos</h3>
              <p className="text-muted-foreground mb-6">
                Probá cambiando el filtro o creando un nuevo flujo.
              </p>
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

      {/* NUEVO: Modal de BLUEPRINTS META */}
      {/* <MetaTemplateBlueprints
        isOpen={showMetaBlueprints}
        onClose={() => setShowMetaBlueprints(false)}
      /> */}
    </div>
  );
};

export default FlowBuilder;
