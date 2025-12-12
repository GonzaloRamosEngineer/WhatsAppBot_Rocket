// C:\Projects\WhatsAppBot_Rocket\src\components\ui\NavigationSidebar.jsx

import React, { useState, useEffect } from "react";
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
  
  // Estado local para controlar el Drawer móvil independientemente del Desktop
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  // Sincronizar: Cuando el padre cambia isCollapsed (botón del Header), abrimos/cerramos móvil
  // Pero SOLO si el cambio fue intencional (evitamos abrirlo al cargar la página si el default es false)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        // En móvil, interpretamos el cambio de "isCollapsed" como un toggle de visibilidad
        // Si isCollapsed cambia, invertimos la visibilidad actual
        // (Esto asume que el botón del header llama a onToggle o setCollapsed)
        if (!isCollapsed) {
            setShowMobileDrawer(true);
        } else {
            setShowMobileDrawer(false);
        }
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
    setShowMobileDrawer(false); // Cerrar al navegar en móvil
    // Si estamos en móvil y navegamos, también colapsamos el estado del padre para resetear
    if (window.innerWidth < 768 && onToggle && !isCollapsed) {
        onToggle(); 
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActivePath = (path) => location?.pathname === path;

  // Renderizado del contenido interno (Reutilizable)
  const SidebarInner = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 shadow-2xl transition-all duration-300 relative group/sidebar">
      
      {/* 1. Logo Section */}
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

      {/* 2. Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
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

              {/* Tooltip (Solo colapsado desktop) */}
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

      {/* 4. BOTÓN OREJUELA (DESKTOP) */}
      {/* Posicionado en el borde derecho, centrado verticalmente. Solo visible en desktop. */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 shadow-md hover:text-indigo-600 hover:border-indigo-200 hover:scale-110 transition-all z-50 cursor-pointer opacity-0 group-hover/sidebar:opacity-100 focus:opacity-100"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Icon name={isCollapsed ? "ChevronRight" : "ChevronLeft"} size={14} />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* --- DESKTOP SIDEBAR (Fijo) --- */}
      <aside
        className={`
          hidden md:block fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-16" : "w-60"}
          ${className}
        `}
      >
        <SidebarInner />
      </aside>

      {/* --- MOBILE DRAWER (Superpuesto) --- */}
      {/* Usamos showMobileDrawer en lugar de isMobileOpen directo para controlar la lógica */}
      {/* Nota: En móvil siempre mostramos la versión "expandida" del contenido (isCollapsed falso visualmente) */}
      {showMobileDrawer && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop Blur - Al hacer click cierra y notifica al padre */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => {
                setShowMobileDrawer(false);
                if (onToggle) onToggle(); // Sincronizar estado del padre
            }}
          />
          
          {/* Drawer Slide-in */}
          <aside className="absolute left-0 top-0 h-full w-64 animate-in slide-in-from-left duration-300 shadow-2xl">
             {/* Forzamos isCollapsed=false para que en móvil se vea completo el menú */}
             {React.cloneElement(<SidebarInner />, { isCollapsed: false })} 
          </aside>
        </div>
      )}
    </>
  );
};

export default NavigationSidebar;