// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-dashboard\components\QuickActions.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/AppIcon";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "New Automation Flow",
      description: "Design automated conversation paths.",
      icon: "GitBranch",
      color: "text-purple-600",
      bg: "bg-purple-50",
      path: "/flow-builder",
    },
    {
      title: "Connect Channel",
      description: "Link a new WhatsApp number.",
      icon: "MessageSquare",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      path: "/channel-setup",
    },
    {
      title: "View Message Logs",
      description: "Audit communication history.",
      icon: "List",
      color: "text-blue-600",
      bg: "bg-blue-50",
      path: "/messages-log",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => navigate(action.path)}
          className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left w-full relative overflow-hidden"
        >
          {/* Icono con fondo de color */}
          <div className={`p-3 rounded-lg ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
             <Icon name={action.icon} size={24} />
          </div>

          <div className="flex-1">
             <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
               {action.title}
             </h4>
             <p className="text-xs text-slate-500 mt-0.5">
               {action.description}
             </p>
          </div>

          {/* Flecha indicadora (aparece en hover) */}
          <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-slate-400">
             <Icon name="ArrowRight" size={18} />
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;