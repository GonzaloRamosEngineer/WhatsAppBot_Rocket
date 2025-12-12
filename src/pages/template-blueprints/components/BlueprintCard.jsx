import { useState } from "react";
import Icon from "../../../components/AppIcon";

const categoryColors = {
  MARKETING: "bg-blue-50 text-blue-700 border-blue-200",
  UTILITY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SERVICE: "bg-orange-50 text-orange-700 border-orange-200",
  AUTHENTICATION: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function BlueprintCard({ bp }) {
  const [activating, setActivating] = useState(false);

  async function activate() {
    const activeChannelId = localStorage.getItem("activeChannel");
    
    if (!activeChannelId) {
      alert("Please select a WhatsApp Channel first in Channel Settings.");
      return;
    }

    setActivating(true);
    try {
      const res = await fetch("/functions/v1/activate-template-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprintId: bp.id,
          channelId: activeChannelId 
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(`Success! Template "${bp.name}" sent to Meta for approval.`);
      } else {
        alert("Error activating: " + (data.error || "Unknown error"));
      }
      console.log(data);
    } catch (e) {
      alert("Network error: " + e.message);
    } finally {
      setActivating(false);
    }
  }

  // Helper para renderizar variables bonitas
  const parsedVariables = typeof bp.variables === 'string' ? JSON.parse(bp.variables) : (bp.variables || []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Header: Badges */}
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide border ${categoryColors[bp.category] || "bg-gray-100 text-gray-600"}`}>
          {bp.category}
        </span>
        <span className="text-[10px] font-medium text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded border border-slate-100">
          {bp.sector}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-slate-800 mb-1">{bp.name}</h3>
      <p className="text-xs text-slate-400 mb-4 capitalize">{bp.use_case.replace('_', ' ')}</p>

      {/* Body Preview */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 mb-4 flex-grow font-sans whitespace-pre-line">
        {bp.body.split(/(\{\{\d+\}\})/).map((part, index) => {
           if (part.match(/\{\{\d+\}\}/)) {
             return <span key={index} className="bg-indigo-50 text-indigo-600 font-mono text-xs px-1 rounded mx-0.5 border border-indigo-100">{part}</span>;
           }
           return part;
        })}
      </div>

      {/* Variables List (if any) */}
      {parsedVariables.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
              {parsedVariables.map(v => (
                  <span key={v.index} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                      {/* CORRECCIÓN AQUÍ: Una sola llave para abrir expresión JS */}
                      {`{{${v.index}}}`} = {v.label}
                  </span>
              ))}
          </div>
      )}

      {/* Action Button */}
      <button
        onClick={activate}
        disabled={activating}
        className={`w-full py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
          ${activating 
            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
            : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-sm"}`}
      >
        {activating ? (
           <>
             <Icon name="Loader2" size={16} className="animate-spin" />
             Activating...
           </>
        ) : (
           <>
             <Icon name="Plus" size={16} />
             Add to My Templates
           </>
        )}
      </button>
    </div>
  );
}