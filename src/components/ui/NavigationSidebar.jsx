import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import { useAuth } from "../../lib/AuthProvider";

const NavigationSidebar = ({
  isCollapsed,        // Estado Desktop (Ancho)
  onToggleCollapse,   // Función para colapsar Desktop
  isMobileOpen,       // Estado Móvil (Visible/Oculto)
  onMobileClose       // Función cerrar Móvil
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navigationItems = [
    { label: "Dashboard", path: "/tenant-dashboard", icon: "LayoutDashboard", tooltip: "Overview" },
    { label: "Channels", path: "/channel-setup", icon: "MessageSquare", tooltip: "Connections" },
    { label: "Templates", path: "/templates", icon: "LayoutTemplate", tooltip: "Meta Templates" },
    { label: "Automation", path: "/flow-builder", icon: "GitBranch", tooltip: "Flow Builder" },
    { label: "Messages Log", path: "/messages-log", icon: "List", tooltip: "Audit History" },
    { label: "Agent Inbox", path: "/agent-inbox", icon: "Headphones", tooltip: "Live Chat", highlight: true },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Contenido interno del Sidebar
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 shadow-2xl relative group">
      
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-slate-800 transition-all shrink-0 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 shrink-0">
             <Icon name="MessageCircle" size={18} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in duration-300 min-w-0">
              <span className="text-sm font-bold text-white tracking-wide truncate">
                Match<span className="text-indigo-400">Bot</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate">
                Workspace
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                group/item relative flex items-center w-full rounded-lg transition-all duration-200 outline-none
                ${isCollapsed ? "justify-center px-0 py-3" : "px-3.5 py-2.5 space-x-3"}
                ${isActive 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" 
                  : item.highlight
                    ? "text-amber-400 hover:bg-slate-800/80 hover:text-amber-300 border border-transparent hover:border-amber-500/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                }
              `}
              title={isCollapsed ? item.tooltip : ""}
            >
              {isActive && !isCollapsed && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-300 rounded-r-full shadow-[0_0_8px_rgba(165,180,252,0.4)]" />
              )}

              <Icon name={item.icon} size={20} className={`transition-colors flex-shrink-0 ${isActive ? "text-white" : ""}`} />
              
              {!isCollapsed && (
                <span className={`text-sm font-medium tracking-tight truncate ${isActive ? "text-white" : "group-hover/item:translate-x-0.5 transition-transform"}`}>
                  {item.label}
                </span>
              )}

              {/* Tooltip Hover (Solo cuando está colapsado) */}
              {isCollapsed && (
                <div className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md shadow-xl border border-slate-700 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 transform rotate-45"></div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50 shrink-0">
        <button
          onClick={handleLogout}
          className={`
            group/logout flex items-center w-full rounded-lg transition-all duration-200 text-slate-400 hover:bg-red-500/10 hover:text-red-400
            ${isCollapsed ? "justify-center px-0 py-3" : "px-3.5 py-2.5 space-x-3"}
          `}
          title={isCollapsed ? "Sign Out" : ""}
        >
           <Icon name="LogOut" size={20} className="flex-shrink-0" />
           {!isCollapsed && (
             <span className="text-sm font-medium tracking-tight group-hover/logout:translate-x-0.5 transition-transform truncate">
               Sign Out
             </span>
           )}
        </button>
      </div>

      {/* --- OREJUELA (Solo Desktop) --- */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 shadow-md hover:text-indigo-600 hover:border-indigo-200 hover:scale-110 transition-all z-50 cursor-pointer opacity-0 group-hover:opacity-100"
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        <Icon name={isCollapsed ? "ChevronRight" : "ChevronLeft"} size={14} />
      </button>
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop (Fijo) */}
      <aside className={`hidden md:block fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out ${isCollapsed ? "w-16" : "w-60"}`}>
        <SidebarContent />
      </aside>

      {/* Sidebar Móvil (Drawer) */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
         {/* En móvil siempre pasamos isCollapsed={false} para verlo completo */}
         {/* Clonamos para forzar la prop, o simplemente llamamos al componente interno */}
         {/* HACK: Usamos un wrapper para pasar props distintas al mismo JSX visual */}
         {/* Aquí simplemente copiamos el JSX interno o lo hacemos flexible. Por simplicidad en este ejemplo, asumo que SidebarContent usa el 'isCollapsed' del closure. 
             CORRECCIÓN: SidebarContent debe recibir props o usar el del padre. 
             Vamos a pasar una prop 'forceExpand' al SidebarContent interno. */}
         <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 relative">
            {/* Header Móvil */}
            <div className="flex items-center h-16 border-b border-slate-800 px-6 justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600">
                        <Icon name="MessageCircle" size={18} className="text-white" />
                    </div>
                    <span className="text-sm font-bold text-white tracking-wide">MATCH<span className="text-indigo-400">BOT</span></span>
                </div>
                <button onClick={onMobileClose} className="text-slate-500 hover:text-white">
                    <Icon name="X" size={20} />
                </button>
            </div>
            
            {/* Nav Móvil (Reutilizamos lógica pero expandida) */}
            <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
                {navigationItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => { navigate(item.path); onMobileClose(); }}
                        className={`flex items-center w-full rounded-lg px-3.5 py-3 space-x-3 transition-all ${location.pathname === item.path ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}
                    >
                        <Icon name={item.icon} size={20} className={location.pathname === item.path ? "text-white" : ""} />
                        <span className="text-sm font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 w-full px-2 py-2">
                    <Icon name="LogOut" size={20} />
                    <span className="text-sm font-medium">Sign Out</span>
                </button>
            </div>
         </div>
      </aside>
    </>
  );
};

export default NavigationSidebar;