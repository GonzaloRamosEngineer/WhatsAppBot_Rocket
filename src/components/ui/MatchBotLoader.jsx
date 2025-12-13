// C:\Projects\WhatsAppBot_Rocket\src\components\ui\MatchBotLoader.jsx

import React from "react";
// Ya no necesitamos importar Icon porque quitaremos el logo central

export default function MatchBotLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50">
      
      {/* SECCIÓN DEL SPINNER (SOLO CIRCULO) */}
      <div className="relative flex items-center justify-center">
        
        {/* 1. Anillo de Fondo (Gris/Azul muy claro) */}
        {/* Define el camino por donde va a girar */}
        <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
        
        {/* 2. Anillo Giratorio (El que se mueve) */}
        {/* Usamos 'absolute' para que se monte encima del anterior */}
        <div className="absolute w-16 h-16 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
        
      </div>
      
      {/* SECCIÓN DE TEXTO */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1">
          MATCH<span className="text-indigo-600">BOT</span>
        </h2>
        
        {/* Puntos de carga animados */}
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