// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-dashboard\components\MetricsCard.jsx

import React from "react";
import Icon from "../../../components/AppIcon";

const MetricsCard = ({
  title,
  value,
  change,
  changeType, // 'positive', 'negative', 'neutral'
  icon,
  color = "blue", // blue, emerald, purple, amber
  isLoading = false,
}) => {
  
  // Paletas de colores predefinidas para consistencia
  const THEMES = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", iconBg: "bg-emerald-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", iconBg: "bg-purple-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", iconBg: "bg-amber-100" },
    primary: { bg: "bg-indigo-50", text: "text-indigo-600", iconBg: "bg-indigo-100" }, // Fallback
  };

  const theme = THEMES[color] || THEMES.primary;

  const getChangeColor = (type) => {
     if (type === 'positive') return 'text-emerald-600';
     if (type === 'negative') return 'text-red-500';
     return 'text-slate-400';
  };

  const getChangeIcon = (type) => {
     if (type === 'positive') return 'TrendingUp';
     if (type === 'negative') return 'TrendingDown';
     return 'Minus';
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-pulse">
        <div className="flex justify-between items-start mb-4">
           <div className="h-3 bg-slate-100 rounded w-24"></div>
           <div className="h-8 w-8 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="h-8 bg-slate-100 rounded w-16 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
      {/* Decorative background blob */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${theme.bg} rounded-bl-full opacity-50 transition-transform group-hover:scale-110`} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</h3>
           <div className={`p-2 rounded-lg ${theme.iconBg} ${theme.text}`}>
              <Icon name={icon} size={20} />
           </div>
        </div>

        <div className="space-y-1">
           <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
           
           {change && (
              <div className="flex items-center gap-1.5 text-xs font-medium">
                 <Icon 
                    name={getChangeIcon(changeType)} 
                    size={14} 
                    className={getChangeColor(changeType)} 
                 />
                 <span className={getChangeColor(changeType)}>
                    {change}
                 </span>
                 <span className="text-slate-400 font-normal ml-1">vs last 7 days</span>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;