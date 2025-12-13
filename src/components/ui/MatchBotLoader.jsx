// C:\Projects\WhatsAppBot_Rocket\src\components\ui\MatchBotLoader.jsx

import React from "react";
import Icon from "../AppIcon";

export default function MatchBotLoader() {
  return (
    // Z-50 y fondo sólido (no transparente) para asegurar que tape todo mientras carga
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50">
      <div className="relative flex items-center justify-center">
        
        {/* 1. Anillo Exterior (Gira lento visualmente usando animate-spin estándar) */}
        <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-100 rounded-full"></div>
        
        {/* 2. Anillo de Carga (El que gira) */}
        <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
        
        {/* 3. Logo Central (Pulsando) */}
        <div className="relative w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center border border-indigo-50 animate-pulse">
           <div className="text-indigo-600">
             {/* Asegúrate de que el Icono exista, si no, pon un texto de fallback */}
             <Icon name="MessageCircle" size={32} />
           </div>
        </div>
      </div>
      
      {/* Texto de carga */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1">
          MATCH<span className="text-indigo-600">BOT</span>
        </h2>
        
        {/* Puntos de carga animados manualmente con delay */}
        <div className="flex gap-1.5 mt-1">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
          Loading Workspace
        </p>
      </div>
    </div>
  );
}