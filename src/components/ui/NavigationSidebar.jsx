// C:\Projects\WhatsAppBot_Rocket\src\components\ui\NavigationSidebar.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import { useAuth } from "../../lib/AuthProvider";

const NavigationSidebar = ({
  // Estas props vienen del padre, pero vamos a priorizar el estado local persistente
  isCollapsed: propIsCollapsed, 
  onToggle: propOnToggle, 
  userRole = "tenant",
  className = "",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // --- 1. ESTADO INTELIGENTE (Persistencia) ---
  // Inicializamos leyendo de localStorage para evitar el "flickeo" al recargar
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false; // Por defecto abierto
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sincronizar el padre si es necesario, pero mandamos nosotros
  useEffect(() => {
    if (propOnToggle && propIsCollapsed !== internalCollapsed) {
       // Opcional: avisar al padre si necesita saberlo, pero visualmente mandamos nosotros
    }
  }, []);

  // Función Toggle Unificada
  const handleToggle = () => {
    const newState = !internalCollapsed;
    setInternalCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
    
    // Si el padre nos pasó un handler, lo llamamos también por cortesía
    if (propOnToggle) propOnToggle();
  };

  // --- 2. GESTIÓN MÓVIL ---
  // Escuchar evento personalizado o prop para abrir menú móvil desde el Header
  useEffect(() => {
    // Si el padre intenta "colapsar/expandir" en móvil, lo interpretamos como "abrir/cerrar" drawer
    const isMobile = window.innerWidth < 768;
    if (isMobile && propOnToggle) {
        // Un pequeño hack: si el header llama a onToggle, detectamos cambio en propIsCollapsed
        // Pero idealmente el Header debería controlar isMobileOpen. 
        // Para simplificar tu vida sin tocar todos los archivos:
        // Asumimos que el botón del Header cambia la prop 'isCollapsed' del padre.
        // Usamos ese cambio para abrir el drawer.
    }
  }, [propIsCollapsed]);

  // Al navegar, cerramos el menú móvil automáticamente
  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false); 
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActivePath = (path) => location?.pathname === path;

  // Detectar cambios de tamaño para cerrar móvil si pasamos a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- CONTENIDO INTERNO (Componente Visual) ---
  // Recibe 'collapsed' como prop para forzar el estado expandido en móvil
  const SidebarContent = ({ collapsed }) => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 shadow-2xl transition-all duration-300 relative group/sidebar">
      
      {/* Header / Logo */}
      <div className={`flex items-center h-16 border-b border-slate-800 transition-all shrink-0 ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 shrink-0">
             <Icon name="MessageCircle" size={18} className="text-white" />
          </div>
          
          {!collapsed && (
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

      {/* Lista de Navegación */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {[
          { label: "Dashboard", path: "/tenant-dashboard", icon: "LayoutDashboard", tooltip: "Overview" },
          { label: "Channels", path: "/channel-setup", icon: "MessageSquare", tooltip: "Connections" },
          { label: "Templates", path: "/templates", icon: "LayoutTemplate", tooltip: "Meta Templates" },
          { label: "Automation", path: "/flow-builder", icon: "GitBranch", tooltip: "Flow Builder" },
          { label: "Messages Log", path: "/messages-log", icon: "List", tooltip: "Audit History" },
          { label: "Agent Inbox", path: "/agent-inbox", icon: "Headphones", tooltip: "Live Chat", highlight: true },
        ].map((item) => {
          const isActive = isActivePath(item.path);
          const isHighlight = item.highlight;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`
                group relative flex items-center w-full rounded-lg transition-all duration-200 outline-none
                ${collapsed ? "justify-center px-0 py-3" : "px-3.5 py-2.5 space-x-3"}
                
                ${isActive 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" 
                  : isHighlight
                    ? "text-amber-400 hover:bg-slate-800/80 hover:text-amber-300 border border-transparent hover:border-amber-500/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                }
              `}
              title={collapsed ? item.tooltip : ""}
            >
              {/* Indicador Activo */}
              {isActive && !collapsed && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-300 rounded-r-full shadow-[0_0_8px_rgba(165,180,252,0.4)]" />
              )}

              <Icon
                name={item.icon}
                size={20}
                className={`transition-colors duration-200 flex-shrink-0 ${isActive ? "text-white" : ""}`}
              />
              
              {!collapsed && (
                <span className={`text-sm font-medium tracking-tight truncate ${isActive ? "text-white" : "group-hover:translate-x-0.5 transition-transform"}`}>
                  {item.label}
                </span>
              )}

              {/* Tooltip (Solo Desktop Colapsado) */}
              {collapsed && (
                <div className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 transform rotate-45"></div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer (Logout) */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50 shrink-0">
        <button
          onClick={handleLogout}
          className={`
            group flex items-center w-full rounded-lg transition-all duration-200 text-slate-400 hover:bg-red-500/10 hover:text-red-400
            ${collapsed ? "justify-center px-0 py-3" : "px-3.5 py-2.5 space-x-3"}
          `}
          title={collapsed ? "Sign Out" : ""}
        >
           <Icon name="LogOut" size={20} className="flex-shrink-0" />
           {!collapsed && (
             <span className="text-sm font-medium tracking-tight group-hover:translate-x-0.5 transition-transform truncate">
               Sign Out
             </span>
           )}
        </button>
      </div>

      {/* BOTÓN OREJUELA (Solo Desktop) */}
      <button
        onClick={handleToggle}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 shadow-md hover:text-indigo-600 hover:border-indigo-200 hover:scale-110 transition-all z-50 cursor-pointer opacity-0 group-hover/sidebar:opacity-100 focus:opacity-100"
        title={collapsed ? "Expand" : "Collapse"}
      >
        <Icon name={collapsed ? "ChevronRight" : "ChevronLeft"} size={14} />
      </button>
    </div>
  );

  return (
    <>
      {/* 1. MOBILE TRIGGER (Invisible pero funcional si el padre pasa props) */}
      {/* Detectamos clicks externos en el botón del header si usan la prop onToggle */}
      <div className="hidden"></div> 

      {/* 2. BOTÓN DE MENÚ FLOTANTE MÓVIL (Backup por si falla el header) */}
      {/* Lo dejamos oculto si ya tienes uno en el header, pero activo lógica para abrir */}
      
      {/* Este effect escucha los clicks del header en las páginas padres */}
      {(() => {
         // Pequeño hack: Si el padre cambia la prop isCollapsed en movil, asumimos que quiere abrir el menú
         if (propOnToggle && window.innerWidth < 768 && propIsCollapsed !== isMobileOpen) {
            // No podemos hacer setState en render, usamos el useEffect arriba
         }
      })()}

      {/* --- DESKTOP SIDEBAR (Fijo) --- */}
      <aside
        className={`
          hidden md:block fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out
          ${internalCollapsed ? "w-16" : "w-60"}
          ${className}
        `}
      >
        <SidebarContent collapsed={internalCollapsed} />
      </aside>

      {/* --- MOBILE DRAWER (Overlay) --- */}
      {/* TRUCO: Usamos una clase 'peer' o control externo. 
          Si no tienes botón en el Sidebar, ¿cómo se abre?
          Como quitamos el botón flotante, el 'isMobileOpen' depende de que lo activemos.
          
          VAMOS A RESTAURAR EL BOTÓN FLOTANTE MÓVIL SOLO SI NO VIENE DEL HEADER.
          O MEJOR: Sincronizar con el prop del padre para abrir.
      */}
      
      {/* Escucha el prop del padre (que viene del botón del header) para abrir en móvil */}
      {/* Si el padre manda isCollapsed=true (default en movil), no hacemos nada.
          Si el padre manda isCollapsed=false (click en header), abrimos el drawer. */}
      
      {(!propIsCollapsed && window.innerWidth < 768) || isMobileOpen ? (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => {
                setIsMobileOpen(false);
                if (propOnToggle) propOnToggle(); // Resetear el padre
            }}
          />
          
          {/* Drawer - SIEMPRE EXPANDIDO (collapsed={false}) */}
          <aside className="absolute left-0 top-0 h-full w-64 animate-in slide-in-from-left duration-300 shadow-2xl">
             <SidebarContent collapsed={false} />
          </aside>
        </div>
      ) : null}
    </>
  );
};

export default NavigationSidebar;