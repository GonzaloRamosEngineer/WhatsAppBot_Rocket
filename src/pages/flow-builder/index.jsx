// C:\Projects\WhatsAppBot_Rocket\src\pages\flow-builder\index.jsx

import React, { useState, useEffect } from "react";
import NavigationSidebar from "../../components/ui/NavigationSidebar";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input"; // Asegúrate de que este componente soporte className o style
import FlowCard from "./components/FlowCard";
import FlowEditor from "./components/FlowEditor";
import FlowPreview from "./components/FlowPreview";
import TemplateLibrary from "./components/TemplateLibrary";

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
  //    Load flows del tenant (tabla flows)
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
    <div className="min-h-screen bg-slate-50">
      
      <NavigationSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleToggleSidebar}
        userRole="tenant"
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-60"}`}>
        
        {/* Header - Flow Builder (Estilo Unificado) */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="bg-purple-600 p-2 rounded-lg text-white shadow-sm shrink-0">
                  <Icon name="GitBranch" size={20} />
               </div>
               <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Flow Builder</h1>
                  <p className="text-slate-500 text-xs font-medium">
                    Design and manage automated bot responses
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-4 self-end md:self-auto">
              {/* Botón de Guardar Crítico */}
              <Button
                variant="outline"
                iconName="Save"
                onClick={handlePersistRules}
                disabled={isSaving || isLoading}
                className={`border-slate-300 hover:border-purple-500 hover:text-purple-600 ${isSaving ? 'opacity-70' : ''}`}
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

        {/* Contenido Principal */}
        <main className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
          
          {/* Alertas UI */}
          <div className="space-y-2">
             {isLoading && (
               <div className="flex items-center gap-2 p-3 bg-slate-100 text-slate-600 rounded-lg text-sm border border-slate-200 animate-pulse">
                 <Icon name="Loader2" className="animate-spin" size={16} /> Cargando reglas...
               </div>
             )}
             {uiError && (
               <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                 <Icon name="AlertTriangle" size={16} /> {uiError}
               </div>
             )}
             {uiMessage && !uiError && (
               <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm border border-emerald-100">
                 <Icon name="CheckCircle" size={16} /> {uiMessage}
               </div>
             )}
          </div>

          {/* Tarjetas de Estadísticas (Estilo Dashboard) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Flows</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalFlows}</p>
               </div>
               <div className="p-3 bg-slate-100 text-slate-500 rounded-lg">
                  <Icon name="Layers" size={24} />
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Active Flows</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.activeFlows}</p>
               </div>
               <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Icon name="CheckCircle" size={24} />
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">Total Triggers</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">{stats.totalTriggers.toLocaleString()}</p>
               </div>
               <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  <Icon name="Zap" size={24} />
               </div>
            </div>
          </div>

          {/* Barra de Herramientas (Búsqueda y Acciones) */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             
             {/* Filtros */}
             <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                   <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                      type="text" 
                      placeholder="Search flows..." 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
             </div>

             {/* Botones de Acción */}
             <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <Button
                  variant="outline"
                  iconName="BookOpen"
                  onClick={() => setIsTemplateLibraryOpen(true)}
                  className="whitespace-nowrap"
                >
                  Templates
                </Button>

                <Button
                  variant="default"
                  iconName="Plus"
                  onClick={handleCreateFlow}
                  className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap shadow-md shadow-purple-200"
                >
                  Create Flow
                </Button>
             </div>
          </div>

          {/* Grid de Flows */}
          {filteredFlows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
              
              {/* Tarjeta de "Crear Nuevo" al final (UX Pattern) */}
              <button 
                 onClick={handleCreateFlow}
                 className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group min-h-[250px]"
              >
                 <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                    <Icon name="Plus" className="text-slate-400 group-hover:text-purple-600" size={24} />
                 </div>
                 <span className="text-sm font-medium text-slate-500 group-hover:text-purple-700">Create New Flow</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Icon name="GitBranch" size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No flows found</h3>
              <p className="text-slate-500 text-sm mt-1 mb-6 max-w-sm mx-auto">
                Try adjusting your search filters or create a new automation flow to get started.
              </p>
              <Button variant="default" onClick={handleCreateFlow} className="bg-purple-600 hover:bg-purple-700">
                 Create First Flow
              </Button>
            </div>
          )}

        </main>
      </div>

      {/* Modals (Sin cambios visuales profundos, solo lógica) */}
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