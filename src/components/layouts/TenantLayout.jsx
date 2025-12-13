// C:\Projects\WhatsAppBot_Rocket\src\components\layouts\TenantLayout.jsx

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
    // 👇 CAMBIO CLAVE 1: Agregamos h-[100dvh] para que en móvil respete el alto real sin barra de navegación
    <div className="flex h-screen h-[100dvh] bg-slate-50 overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <NavigationSidebar 
        isCollapsed={isCollapsed} 
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* 2. AREA DE CONTENIDO */}
      {/* 👇 CAMBIO CLAVE 2: Agregamos 'relative' y mantenemos 'overflow-hidden' aquí */}
      {/* Esto crea el marco fijo. La página hija (Outlet) será la que tenga el scroll (overflow-y-auto) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out relative overflow-hidden ${isCollapsed ? "md:ml-16" : "md:ml-60"}`}>
        
        {/* Las páginas se renderizan aquí y ellas controlan su propio scroll interno */}
        <Outlet context={{ 
            isSidebarCollapsed: isCollapsed, 
            toggleMobileMenu: () => setIsMobileOpen(!isMobileOpen) 
        }} />
        
      </div>

      {/* Overlay Móvil */}
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