// C:\Projects\WhatsAppBot_Rocket\src\pages\flow-builder\components\FlowCard.jsx

import React from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const FlowCard = ({ flow, onEdit, onToggle, onDelete, onPreview }) => {
  
  // --- LÓGICA ORIGINAL (INTACTA) ---
  const getStatusColor = (isActive) => {
    return isActive ? "text-emerald-600" : "text-slate-400";
  };

  const getTriggerTypeIcon = (type) => {
    switch (type) {
      case "keyword": return "MessageSquare";
      case "welcome": return "Hand";
      case "fallback": return "HelpCircle";
      default: return "GitBranch"; // Default más genérico
    }
  };

  const getTriggerTypeLabel = (type) => {
    switch (type) {
      case "keyword": return "Keyword Trigger";
      case "welcome": return "Welcome Message";
      case "fallback": return "Default Reply";
      default: return "Custom Trigger";
    }
  };

  // Renderizado optimizado visualmente
  const renderTriggerDescription = () => {
    if (flow?.triggerType === "keyword") {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {flow?.keywords?.slice(0, 5).map((keyword, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md border border-slate-200"
            >
              {keyword}
            </span>
          ))}
          {flow?.keywords?.length > 5 && (
             <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] rounded-md">+{flow.keywords.length - 5}</span>
          )}
        </div>
      );
    }
    if (flow?.triggerType === "welcome") {
      return <span className="text-xs text-slate-500 italic">Triggers on first conversation start.</span>;
    }
    if (flow?.triggerType === "fallback") {
      return <span className="text-xs text-slate-500 italic">Triggers when no other rule matches.</span>;
    }
    return <span className="text-xs text-slate-400">No trigger defined.</span>;
  };

  // --- RENDERIZADO VISUAL ---
  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 flex flex-col h-full relative overflow-hidden">
      
      {/* Decoración de fondo en hover */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* HEADER: Icono + Título + Toggle */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Icon name={getTriggerTypeIcon(flow?.triggerType)} size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-purple-700 transition-colors">
              {flow?.name || "Untitled Flow"}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium uppercase tracking-wide">
              {getTriggerTypeLabel(flow?.triggerType)}
            </p>
          </div>
        </div>

        {/* Toggle Switch Visual */}
        <button
          onClick={() => onToggle(flow?.id)}
          className={`relative w-9 h-5 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
            flow?.isActive ? "bg-emerald-500" : "bg-slate-200"
          }`}
          title={flow?.isActive ? "Deactivate" : "Activate"}
        >
          <span
            className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform duration-200 ease-in-out mt-1 ml-1 shadow-sm ${
              flow?.isActive ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* BODY: Trigger & Response Preview */}
      <div className="flex-1 space-y-4 relative z-10">
        
        {/* Trigger Section */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
            <Icon name="Zap" size={12} className="text-amber-500" />
            <span>Trigger</span>
          </div>
          <div className="min-h-[24px]">
             {renderTriggerDescription()}
          </div>
        </div>

        {/* Response Preview */}
        <div>
           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
            <Icon name="MessageCircle" size={12} className="text-blue-500" />
            <span>Response</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-md border border-slate-100 min-h-[40px]">
             <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {flow?.responses?.[0]?.message || <span className="italic text-slate-400">No response configured</span>}
             </p>
          </div>
          {flow?.responses?.length > 1 && (
             <p className="text-[10px] text-slate-400 mt-1 text-right">+{flow.responses.length - 1} more steps</p>
          )}
        </div>
      </div>

      {/* FOOTER: Stats y Acciones */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
        
        {/* Stats */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
           <div className="flex items-center gap-1" title="Times Triggered">
              <Icon name="PlayCircle" size={12} /> {flow?.triggerCount || 0} runs
           </div>
           {/* Si tuvieras fecha de update */}
           {/* <div className="flex items-center gap-1">
              <Icon name="Clock" size={12} /> {flow?.lastUpdated}
           </div> */}
        </div>

        {/* Actions (Botones icon-only limpios) */}
        <div className="flex items-center gap-1">
           <button 
             onClick={() => onPreview(flow)}
             className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" 
             title="Preview"
           >
              <Icon name="Eye" size={16} />
           </button>
           <button 
             onClick={() => onEdit(flow)}
             className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors" 
             title="Edit Flow"
           >
              <Icon name="Edit3" size={16} />
           </button>
           <button 
             onClick={() => onDelete(flow?.id)}
             className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
             title="Delete"
           >
              <Icon name="Trash2" size={16} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default FlowCard;