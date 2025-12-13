// C:\Projects\WhatsAppBot_Rocket\src\pages\template-blueprints\index.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom"; // CONEXIÓN CON LAYOUT
import BlueprintCard from "./components/BlueprintCard";
import { supabase } from "../../lib/supabaseClient";
import Icon from "../../components/AppIcon";

// Imports de Componentes UI
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import { useAuth } from "../../lib/AuthProvider";

// Constantes para filtros visuales
const CATEGORIES = [
  { id: "ALL", label: "All Templates" },
  { id: "MARKETING", label: "Marketing" },
  { id: "UTILITY", label: "Utility" },
  { id: "AUTHENTICATION", label: "Auth" },
  { id: "SERVICE", label: "Service" },
];

const SECTORS = [
  { id: "ALL", label: "All Industries", icon: "Grid3X3" },
  { id: "telecom", label: "Telecom / ISP", icon: "Wifi" },
  { id: "club", label: "Sports & Clubs", icon: "Dumbbell" },
  { id: "fundacion", label: "Non-Profit", icon: "Heart" },
  { id: "negocio", label: "Retail & Business", icon: "Store" },
  { id: "salud", label: "Healthcare", icon: "Activity" },
];

export default function TemplateBlueprintsPage() {
  const { tenant, profile, logout } = useAuth();
  
  // 👇 1. Contexto del Layout
  const { toggleMobileMenu } = useOutletContext();
  
  // Data State
  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSector, setSelectedSector] = useState("ALL");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("template_blueprints")
      .select("*")
      .order("name", { ascending: true });
    setBlueprints(data || []);
    setLoading(false);
  }

  // 🧠 Lógica de Filtrado en tiempo real
  const filteredBlueprints = useMemo(() => {
    return blueprints.filter((bp) => {
      // 1. Filtro Texto
      const textMatch = 
        bp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bp.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bp.use_case.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Filtro Categoría
      const catMatch = selectedCategory === "ALL" || bp.category === selectedCategory;

      // 3. Filtro Sector
      const sectorMatch = selectedSector === "ALL" || bp.sector === selectedSector;

      return textMatch && catMatch && sectorMatch;
    });
  }, [blueprints, searchTerm, selectedCategory, selectedSector]);

  const currentUser = {
    name: tenant?.name || "Tenant",
    // 🛑 TRUCO: Email nulo para ocultarlo en el header
    email: null,
    avatar: null,
    role: profile?.role || "tenant",
  };

  const handleLogout = async () => {
    await logout();
  };

  // --- RENDER REFACTORIZADO (Layout Pattern + Scroll Fix) ---
  return (
    // 👇 CAMBIO CLAVE: h-full + overflow-y-auto para permitir scroll fluido en móvil
    <div className="h-full overflow-y-auto bg-slate-50 animate-fade-in">
      
      {/* Header Unificado & Responsive */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 sticky top-0 z-20 shadow-sm transition-all">
        <div className="flex items-center justify-between">
          
          {/* IZQUIERDA: Menú + Icono + Título */}
          <div className="flex items-center gap-3">
             
             {/* Botón Menú (Solo Móvil) - Estilo Índigo Unificado */}
             <button 
               onClick={toggleMobileMenu}
               className="md:hidden p-2 mr-1 text-indigo-600 bg-white border border-indigo-100 rounded-lg shadow-sm hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md transition-all active:scale-95"
               title="Toggle Menu"
             >
               <Icon name="Menu" size={20} />
             </button>

             <div className="hidden md:block bg-indigo-600 p-2 rounded-lg text-white shadow-sm shadow-indigo-200">
                <Icon name="LayoutTemplate" size={20} />
             </div>
             <div>
                <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                  Template Library
                </h1>
                <p className="text-slate-500 text-xs font-medium hidden md:block">
                  Official WhatsApp Blueprints • <span className="text-emerald-600 font-semibold">{blueprints.length} ready</span>
                </p>
             </div>
          </div>

          {/* DERECHA: Perfil (Sin email) */}
          <UserProfileDropdown user={currentUser} onLogout={handleLogout} />
        </div>
      </header>

      {/* Main Content (Sin márgenes extra + Padding Bottom para móvil) */}
      <main className="p-4 md:p-8 max-w-[1600px] mx-auto w-full pb-24">
        
        {/* 🔍 FILTERS BAR */}
        <div className="mb-8 space-y-4">
          
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              {/* Search */}
              <div className="w-full md:w-96 relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <Icon name="Search" size={18} />
                  </div>
                  <input 
                      type="text"
                      placeholder="Search templates..."
                      className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>

              {/* Sector Dropdown */}
              <div className="relative w-full md:w-auto min-w-[200px]">
                  <div className="relative">
                      <select 
                          className="w-full appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm transition-all cursor-pointer"
                          value={selectedSector}
                          onChange={(e) => setSelectedSector(e.target.value)}
                      >
                          {SECTORS.map(s => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                          <Icon name="ChevronDown" size={16} />
                      </div>
                  </div>
              </div>
          </div>

          {/* Category Tabs */}
          <div className="flex overflow-x-auto pb-2 border-b border-slate-200 gap-2 custom-scrollbar no-scrollbar">
              {CATEGORIES.map(cat => {
                  const isActive = selectedCategory === cat.id;
                  return (
                      <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border whitespace-nowrap
                              ${isActive 
                                  ? "bg-slate-800 text-white border-slate-800 shadow-md" 
                                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                              }
                          `}
                      >
                          {cat.label}
                      </button>
                  )
              })}
          </div>
        </div>

        {/* 📦 GRID CONTENT */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                 <div key={i} className="h-72 bg-white rounded-xl border border-slate-100 shadow-sm p-4 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="h-6 bg-slate-200 rounded w-2/3 mb-2"></div>
                    <div className="h-32 bg-slate-100 rounded mb-4"></div>
                    <div className="h-10 bg-slate-200 rounded"></div>
                 </div>
             ))}
          </div>
        ) : (
          <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {filteredBlueprints.length > 0 ? (
                  filteredBlueprints.map((bp) => (
                  <BlueprintCard key={bp.id} bp={bp} />
                  ))
              ) : (
                  <div className="col-span-full py-20 text-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                          <Icon name="SearchX" size={32} className="text-slate-400 opacity-50"/>
                      </div>
                      <h3 className="text-lg font-medium text-slate-800">No templates found</h3>
                      <p className="text-slate-500 max-w-xs mx-auto mt-1 text-sm">
                          Try selecting "All Industries" or a different category.
                      </p>
                      <button 
                          onClick={() => {setSearchTerm(""); setSelectedCategory("ALL"); setSelectedSector("ALL")}}
                          className="mt-4 text-indigo-600 font-medium text-sm hover:underline"
                      >
                          Clear all filters
                      </button>
                  </div>
              )}
              </div>
          </>
        )}
      </main>
    </div>
  );
}