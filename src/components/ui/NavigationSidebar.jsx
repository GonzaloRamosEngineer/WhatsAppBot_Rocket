// C:\Projects\WhatsAppBot_Rocket\src\components\ui\NavigationSidebar.jsx

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import { useAuth } from "../../lib/AuthProvider";

const NavigationSidebar = ({
  isCollapsed = false,
  onToggle,
  userRole = "tenant",
  className = "",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Control interno para el menú móvil
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Referencia para evitar que el menú se abra solo al cargar la página
  const isFirstRender = useRef(true);

  // Sincronización Inteligente: 
  // Si el padre cambia isCollapsed (click en Header) y estamos en móvil, abrimos/cerramos el drawer.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Si cambia el estado desde afuera (Header button), invertimos la visibilidad móvil
      setIsMobileOpen(prev => !prev);
    }
  }, [isCollapsed]);

  const navigationItems = [
    { label: "Dashboard", path: "/tenant-dashboard", icon: "LayoutDashboard", tooltip: "Overview" },
    { label: "Channels", path: "/channel-setup", icon: "MessageSquare", tooltip: "Connections" },
    { label: "Templates", path: "/templates", icon: "LayoutTemplate", tooltip: "Meta Templates" },
    { label: "Automation", path: "/flow-builder", icon: "GitBranch", tooltip: "Flow Builder" },
    { label: "Messages Log", path: "/messages-log", icon: "List", tooltip: "Audit History" },
    { label: "Agent Inbox", path: "/agent-inbox", icon: "Headphones", tooltip: "Live Chat", highlight: true },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false); // Cerrar siempre al navegar
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActivePath = (path) => location?.pathname === path;

  // --- CONTENIDO INTERNO DEL SIDEBAR (Reutilizable) ---
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 shadow-2xl">
      
      {/* 1. Header / Logo */}
      <div className={`flex items-center h-16 border-b border-slate-800 transition-all shrink-0 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 shrink-0">
             <Icon name="MessageCircle" size={18} className="text-white" />
          </div>
          
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in duration-300 min-w-0">
              <span className="text-sm font-bold text-white tracking-wide truncate">
                MATCH<span className="text-indigo-400">BOT</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate">
                Workspace
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Lista de Navegación */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navigationItems.map((item) => {
          const isActive = isActivePath(item.path);
          const isHighlight = item.highlight;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`
                group relative flex items-center w-full rounded-lg transition-all duration-200 outline-none
                ${isCollapsed ? "justify-center px-0 py-3" : "px-3.5 py-2.5 space-x-3"}
                
                ${isActive 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" 
                  : isHighlight
                    ? "text-amber-400 hover:bg-slate-800/80 hover:text-amber-300 border border-transparent hover:border-amber-500/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                }
              `}
              title={isCollapsed ? item.tooltip : ""}
            >
              {isActive && !isCollapsed && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-300 rounded-r-full shadow-[0_0_8px_rgba(165,180,252,0.4)]" />
              )}

              <Icon
                name={item.icon}
                size={20}
                className={`transition-colors duration-200 flex-shrink-0 ${isActive ? "text-white" : ""}`}
              />
              
              {!isCollapsed && (
                <span className={`text-sm font-medium tracking-tight truncate ${isActive ? "text-white" : "group-hover:translate-x-0.5 transition-transform"}`}>
                  {item.label}
                </span>
              )}

              {/* Tooltip Hover (Solo Desktop Colapsado) */}
              {isCollapsed && (
                <div className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 transform rotate-45"></div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Footer (Logout) */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50 shrink-0">
        <button
          onClick={handleLogout}
          className={`
            group flex items-center w-full rounded-lg transition-all duration-200 text-slate-400 hover:bg-red-500/10 hover:text-red-400
            ${isCollapsed ? "justify-center px-0 py-3" : "px-3.5 py-2.5 space-x-3"}
          `}
          title={isCollapsed ? "Sign Out" : ""}
        >
           <Icon name="LogOut" size={20} className="flex-shrink-0" />
           {!isCollapsed && (
             <span className="text-sm font-medium tracking-tight group-hover:translate-x-0.5 transition-transform truncate">
               Sign Out
             </span>
           )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={`
          hidden md:block fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out border-r border-slate-800
          ${isCollapsed ? "w-16" : "w-60"}
          ${className}
        `}
      >
        <SidebarContent />

        {/* 4. BOTÓN "OREJUELA" (Solo Desktop - Fuera del contenido, pegado al borde) */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 shadow-md hover:text-indigo-600 hover:border-indigo-200 hover:scale-110 transition-all z-50 cursor-pointer"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <Icon name={isCollapsed ? "ChevronRight" : "ChevronLeft"} size={14} />
          </button>
        )}
      </aside>

      {/* --- MOBILE DRAWER --- */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileOpen(false)}
          />
          
          <aside className="absolute left-0 top-0 h-full w-64 animate-in slide-in-from-left duration-300 shadow-2xl">
             {/* Forzamos isCollapsed=false en móvil para ver textos */}
             {React.cloneElement(<SidebarContent />, { isCollapsed: false })}
          </aside>
        </div>
      )}
    </>
  );
};

export default NavigationSidebar;