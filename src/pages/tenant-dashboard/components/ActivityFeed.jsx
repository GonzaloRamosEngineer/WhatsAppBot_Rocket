// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-dashboard\components\ActivityFeed.jsx

import React from "react";
import Icon from "../../../components/AppIcon";

const ActivityFeed = ({ activities = [], isLoading = false }) => {
  
  const getActivityConfig = (type) => {
    switch (type) {
      case "message_sent":
        return { icon: "Send", color: "text-blue-500", bg: "bg-blue-50" };
      case "message_received":
        return { icon: "MessageCircle", color: "text-emerald-500", bg: "bg-emerald-50" };
      case "flow_triggered":
        return { icon: "GitBranch", color: "text-purple-500", bg: "bg-purple-50" };
      case "channel_connected":
        return { icon: "Link", color: "text-amber-500", bg: "bg-amber-50" };
      default:
        return { icon: "Activity", color: "text-slate-500", bg: "bg-slate-50" };
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Recent Activity</h3>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 bg-slate-100 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-2 bg-slate-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Activity</h3>
        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
          View All
        </button>
      </div>

      <div className="relative space-y-0">
        {activities.length === 0 ? (
          <div className="text-center py-10 opacity-60">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
               <Icon name="Activity" size={20} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const config = getActivityConfig(activity.type);
            const isLast = index === activities.length - 1;

            return (
              <div key={activity.id || index} className="relative flex gap-4 pb-6 group">
                {/* Línea conectora (Timeline) */}
                {!isLast && (
                   <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-100 group-hover:bg-slate-200 transition-colors" />
                )}

                {/* Icono */}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white shadow-sm ${config.bg} ${config.color}`}>
                   <Icon name={config.icon} size={14} />
                </div>

                {/* Contenido */}
                <div className="flex-1 pt-0.5">
                   <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-700">{activity.title}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                         {formatTime(activity.timestamp)}
                      </span>
                   </div>
                   
                   <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {activity.description}
                   </p>

                   {/* Status Chip (Opcional) */}
                   {activity.status && (
                      <span className={`inline-flex mt-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                         activity.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                         {activity.status}
                      </span>
                   )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;