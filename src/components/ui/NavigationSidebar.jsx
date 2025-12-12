// C:\Projects\WhatsAppBot_Rocket\src\components\ui\NavigationSidebar.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import { useAuth } from "../../lib/AuthProvider"; // Importamos Auth para el Logout

const NavigationSidebar = ({
  isCollapsed = false,
  onToggle,
  userRole = "tenant",
  className = "",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth(); // Hook de autenticación
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = [
    {
      label: "Dashboard",
      path: "/tenant-dashboard",
      icon: "LayoutDashboard",
      tooltip: "Overview",
    },
    {
      label: "Channels",
      path: "/channel-setup",
      icon: "MessageSquare",
      tooltip: "Connections",
    },
    {
      label: "Templates",
      path: "/templates",
      icon: "LayoutTemplate",
      tooltip: "Meta Templates",
    },
    {
      label: "Automation",
      path: "/flow-builder",
      icon: "GitBranch",
      tooltip: "Flow Builder",
    },
    {
      label: "Messages Log",
      path: "/messages-log",
      icon: "List",
      tooltip: "Audit History",
    },
    // Agent Inbox Destacado
    {
      label: "Agent Inbox",
      path: "/agent-inbox",
      icon: "Headphones",
      tooltip: "Live Chat",
      highlight: true, // Se verá diferente
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActivePath = (path) => {
    return location?.pathname === path;
  };

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 shadow-2xl transition-all duration-300">
      
      {/* 1. Logo Section (Brand) */}
      <div className={`flex items-center h-16 border-b border-slate-800 transition-all ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
             <Icon name="MessageCircle" size={18} className="text-white" />
          </div>
          
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in duration-300">
              <span className="text-sm font-bold text-white tracking-wide">
                MATCH<span className="text-indigo-400">BOT</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
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
                
                ${/* Estilos Base / Activo */ ''}
                ${isActive 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" 
                  : isHighlight 
                    ? "text-amber-400 hover:bg-slate-800/80 hover:text-amber-300" // Highlight (Inbox)
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100" // Normal
                }
              `}
              title={isCollapsed ? item.tooltip : ""}
            >
              {/* Active Indicator (Left Bar) */}
              {isActive && !isCollapsed && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-300 rounded-r-full shadow-[0_0_8px_rgba(165,180,252,0.4)]" />
              )}

              <Icon
                name={item.icon}
                size={20}
                className={`transition-colors duration-200 ${isActive ? "text-white" : ""}`}
              />
              
              {!isCollapsed && (
                <span className={`text-sm font-medium tracking-tight ${isActive ? "text-white" : "group-hover:translate-x-0.5 transition-transform"}`}>
                  {item.label}
                </span>
              )}

              {/* Tooltip personalizado para modo colapsado */}
              {isCollapsed && (
                <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 transform rotate-45"></div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Footer Actions (Logout + Toggle) */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50 space-y-2">
        
        {/* Botón Logout */}
        <button
          onClick={handleLogout}
          className={`
            group flex items-center w-full rounded-lg transition-all duration-200 text-slate-400 hover:bg-red-500/10 hover:text-red-400
            ${isCollapsed ? "justify-center px-0 py-3" : "px-3.5 py-2.5 space-x-3"}
          `}
          title={isCollapsed ? "Sign Out" : ""}
        >
           <Icon name="LogOut" size={20} />
           {!isCollapsed && (
             <span className="text-sm font-medium tracking-tight group-hover:translate-x-0.5 transition-transform">
               Sign Out
             </span>
           )}
        </button>

        {/* Botón Collapse (Solo si se pasa la prop) */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors mt-1"
          >
            <Icon name={isCollapsed ? "ChevronRight" : "ChevronsLeft"} size={18} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button (Floating) - Ahora oculto porque lo pusimos en el Header principal */}
      {/* Si decides mantenerlo aquí, descomenta: */}
      {/* <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg shadow-lg active:scale-95 transition-transform"
      >
        <Icon name="Menu" size={20} />
      </button> 
      */}

      {/* Desktop Sidebar (Fixed) */}
      <aside
        className={`
          hidden md:block fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-16" : "w-60"}
          ${className}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay (Backdrop + Drawer) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop Blur */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Drawer Slide-in */}
          <aside className="absolute left-0 top-0 h-full w-64 animate-in slide-in-from-left duration-300 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default NavigationSidebar;