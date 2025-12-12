// C:\Projects\WhatsAppBot_Rocket\src\pages\template-blueprints\index.jsx

import React, { useEffect, useState, useMemo } from "react";
import BlueprintCard from "./components/BlueprintCard";
import { supabase } from "../../lib/supabaseClient";
import Icon from "../../components/AppIcon";

// Imports de Layout
import NavigationSidebar from "../../components/ui/NavigationSidebar";
import UserProfileDropdown from "../../components/ui/UserProfileDropdown";
import { useAuth } from "../../lib/AuthProvider";

// Componentes UI simples para los filtros
import Input from "../../components/ui/Input"; 

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
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
    email: profile?.role === "tenant" ? "tenant@business.com" : "admin@whatsappbot.com",
    avatar: null,
    role: profile?.role || "tenant",
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. SIDEBAR */}
      <NavigationSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userRole="tenant"
      />

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className={`flex-1 transition-all duration-200 ${isSidebarCollapsed ? "ml-16" : "ml-60"}`}>
        
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="bg-indigo-600 p-2 rounded-lg text-white">
                  <Icon name="LayoutTemplate" size={20} />
               </div>
               <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Meta Template Library</h1>
                  <p className="text-slate-500 text-xs font-medium">
                    Official WhatsApp Blueprints • <span className="text-emerald-600">{blueprints.length} available</span>
                  </p>
               </div>
            </div>
            <UserProfileDropdown user={currentUser} onLogout={handleLogout} />
          </div>
        </header>

        <main className="p-8 max-w-[1600px] mx-auto">
          
          {/* 🔍 FILTERS BAR (La parte "Pro") */}
          <div className="mb-8 space-y-4">
            
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                {/* Search */}
                <div className="w-full md:w-96 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Icon name="Search" size={18} />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search templates (e.g. 'welcome', 'offer')..."
                        className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Sector Dropdown */}
                <div className="relative min-w-[200px]">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Filter by Industry</label>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-2.5 pl-4 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm transition-all cursor-pointer"
                            value={selectedSector}
                            onChange={(e) => setSelectedSector(e.target.value)}
                        >
                            {SECTORS.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <Icon name="ChevronDown" size={14} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Tabs (Pills) */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
                {CATEGORIES.map(cat => {
                    const isActive = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border
                                ${isActive 
                                    ? "bg-slate-800 text-white border-slate-800 shadow-md transform scale-105" 
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
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="SearchX" size={32} className="text-slate-400 opacity-50"/>
                        </div>
                        <h3 className="text-lg font-medium text-slate-800">No templates found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-1">
                            We couldn't find any templates matching your filters. Try selecting "All Industries" or a different category.
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
    </div>
  );
}