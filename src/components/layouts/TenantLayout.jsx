import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavigationSidebar from "../ui/NavigationSidebar";

const TenantLayout = () => {
  const location = useLocation();
  
  // Estado persistente del Sidebar (Desktop)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  // Estado del menú móvil (Independiente)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Guardar preferencia de colapso
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  // Cerrar menú móvil al cambiar de ruta automáticamente
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* 1. SIDEBAR (Instancia ÚNICA para toda la app) */}
      <NavigationSidebar 
        isCollapsed={isCollapsed} 
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* 2. AREA DE CONTENIDO (Donde se renderizan tus páginas) */}
      {/* Pasamos context para que las páginas puedan controlar el menú móvil si quieren */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? "md:ml-16" : "md:ml-60"}`}>
        
        {/* Aquí se inyectan las páginas (Dashboard, Inbox, etc.) */}
        <Outlet context={{ 
            isSidebarCollapsed: isCollapsed, 
            toggleMobileMenu: () => setIsMobileOpen(!isMobileOpen) 
        }} />
        
      </div>

      {/* Overlay Móvil (Backdrop oscuro) */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
};

export default TenantLayout;