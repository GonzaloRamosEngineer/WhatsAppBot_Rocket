// C:\Projects\WhatsAppBot_Rocket\src\components\ui\MatchBotLoader.jsx

import React from "react";
import Icon from "../AppIcon";

export default function MatchBotLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50">
      <div className="relative flex items-center justify-center">
        
        {/* 1. Anillo Exterior (Estático y sutil) */}
        <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-50 rounded-full"></div>
        
        {/* 2. Anillo de Carga (Girando) - Índigo vibrante */}
        <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
        
        {/* 3. Caja Central (ESTÁTICA y LIMPIA) */}
        {/* Quitamos 'animate-pulse' y 'shadow-lg' para eliminar el efecto fantasma */}
        <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-indigo-100 z-10">
           <div className="text-indigo-600">
             <Icon name="MessageCircle" size={32} />
           </div>
        </div>
      </div>
      
      {/* Texto de carga */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1">
          MATCH<span className="text-indigo-600">BOT</span>
        </h2>
        
        {/* Puntos de carga (Esto da la sensación de actividad en lugar del logo parpadeando) */}
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