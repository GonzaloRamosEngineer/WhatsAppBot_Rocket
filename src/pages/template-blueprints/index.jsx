import React, { useEffect, useState } from "react";
import BlueprintCard from "./components/BlueprintCard";
import { supabase } from "../../lib/supabaseClient";
import Icon from "../../components/AppIcon";

// 👇 IMPORTS DE LAYOUT (Necesarios para que se vea el menú)
import NavigationSidebar from "../../components/ui/NavigationSidebar";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import { useAuth } from "../../lib/AuthProvider";

export default function TemplateBlueprintsPage() {
  const { tenant, profile, logout } = useAuth(); // Hook de autenticación
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("template_blueprints")
      .select("*")
      .order("sector", { ascending: true });
    setBlueprints(data || []);
    setLoading(false);
  }

  // Objeto de usuario para el dropdown del header
  const currentUser = {
    name: tenant?.name || "Tenant",
    email: profile?.role === "tenant" ? "tenant@business.com" : "admin@whatsappbot.com",
    avatar: null,
    role: profile?.role || "tenant",
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. BARRA LATERAL */}
      <NavigationSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userRole="tenant"
      />

      {/* 2. CONTENEDOR PRINCIPAL (Se ajusta según la barra lateral) */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-60"}`}>
        
        {/* 3. ENCABEZADO (HEADER) */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meta Template Library</h1>
              <p className="text-slate-500 text-sm mt-1">
                Explore and activate official WhatsApp message templates.
              </p>
            </div>

            <div className="flex items-center space-x-6">
              <UserProfileDropdown user={currentUser} onLogout={handleLogout} />
            </div>
          </div>
        </header>

        {/* 4. CONTENIDO DE LA PÁGINA (Blueprints) */}
        <main className="p-8 max-w-7xl mx-auto">
          
          {loading ? (
            // Skeleton loading state
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1, 2, 3, 4, 5, 6].map((i) => (
                   <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
               ))}
            </div>
          ) : (
            // Grid de tarjetas
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blueprints.length > 0 ? (
                blueprints.map((bp) => (
                  <BlueprintCard key={bp.id} bp={bp} />
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-slate-400">
                  <Icon name="Search" size={48} className="mx-auto mb-2 opacity-50"/>
                  <p>No templates found available.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}