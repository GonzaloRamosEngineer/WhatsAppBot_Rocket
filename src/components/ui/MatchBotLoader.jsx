import React from "react";
import Icon from "../AppIcon";

export default function MatchBotLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm transition-all">
      <div className="relative">
        {/* Anillo exterior girando */}
        <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-200 rounded-full animate-spin-slow"></div>
        <div className="absolute inset-0 w-20 h-20 border-t-4 border-indigo-600 rounded-full animate-spin"></div>
        
        {/* Logo central estático o pulsando */}
        <div className="relative w-20 h-20 flex items-center justify-center bg-white rounded-full shadow-xl border border-slate-100">
           <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white p-3 rounded-xl animate-pulse">
             <Icon name="MessageCircle" size={32} />
           </div>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          MATCH<span className="text-indigo-600">BOT</span>
        </h2>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-150"></div>
        </div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-2">
          System Initializing
        </p>
      </div>
    </div>
  );
}