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

// ⬇️ NUEVO: hooks globales
import { useAuth } from "@/lib/AuthProvider";
import { useMockApi } from "@/lib/useMockApi";

const FlowBuilder = () => {
  const { profile } = useAuth();
  const { tenant, flows, createFlow } = useMockApi();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [localFlows, setLocalFlows] = useState([]);

  // Inicializa flows desde el mock
  useEffect(() => {
    setLocalFlows(flows || []);
  }, [flows]);

  const handleToggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const handleLogout = () => console.log("Logging out...");
  const handleProfileClick = () => console.log("Opening profile...");

  const handleCreateFlow = () => {
    setSelectedFlow(null);
    setIsEditorOpen(true);
  };

  const handleEditFlow = (flow) => {
    setSelectedFlow(flow);
    setIsEditorOpen(true);
  };

  const handleDeleteFlow = (flowId) => {
    if (window.confirm("Are you sure you want to delete this flow?")) {
      setLocalFlows((prev) => prev.filter((flow) => flow.id !== flowId));
    }
  };

  const handleToggleFlow = (flowId) => {
    setLocalFlows((prev) =>
      prev.map((flow) =>
        flow.id === flowId ? { ...flow, isActive: !flow.isActive } : flow
      )
    );
  };

  const handlePreviewFlow = (flow) => {
    setSelectedFlow(flow);
    setIsPreviewOpen(true);
  };

  const handleSaveFlow = (flowData) => {
    if (selectedFlow) {
      // Update existing flow
      setLocalFlows((prev) =>
        prev.map((flow) => (flow.id === selectedFlow.id ? flowData : flow))
      );
    } else {
      // Add new flow (also to mock)
      const newFlow = createFlow(flowData.name || "Untitled Flow", flowData.draft);
      setLocalFlows((prev) => [...prev, newFlow]);
    }
  };

  const handleSelectTemplate = (templateData) => {
    setLocalFlows((prev) => [...prev, templateData]);
  };

  const filteredFlows = localFlows.filter((flow) => {
    const matchesSearch =
      flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                Create and manage automated chatbot conversations
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <UserProfileDropdown
                user={currentUser}
                onLogout={handleLogout}
                onProfileClick={handleProfileClick}
              />
            </div>
          </div>
        </header>

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
                  <p className="text-sm text-muted-foreground">Total Flows</p>
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
                  <p className="text-sm text-muted-foreground">Active Flows</p>
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
                    Total Triggers
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Input
                placeholder="Search flows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Flows</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                iconName="BookOpen"
                iconPosition="left"
                onClick={() => setIsTemplateLibraryOpen(true)}
              >
                Templates
              </Button>
              <Button
                variant="default"
                iconName="Plus"
                iconPosition="left"
                onClick={handleCreateFlow}
              >
                Create Flow
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
                <Icon name="GitBranch" size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "No flows found"
                  : "No flows created yet"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Create your first automated flow to start engaging with customers on WhatsApp."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    variant="outline"
                    iconName="BookOpen"
                    iconPosition="left"
                    onClick={() => setIsTemplateLibraryOpen(true)}
                  >
                    Browse Templates
                  </Button>
                  <Button
                    variant="default"
                    iconName="Plus"
                    iconPosition="left"
                    onClick={handleCreateFlow}
                  >
                    Create Flow
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
