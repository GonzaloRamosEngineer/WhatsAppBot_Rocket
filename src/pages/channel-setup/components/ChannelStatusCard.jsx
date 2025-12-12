// C:\Projects\WhatsAppBot_Rocket\src\pages\channel-setup\components\ChannelStatusCard.jsx

import React, { useState } from "react";
import Icon from "../../../components/AppIcon";

const ChannelStatusCard = ({ isConnected, channelData, onToggleChannel }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleChannel = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Fake visual delay
      if (onToggleChannel) {
        onToggleChannel(!channelData?.isActive);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = {
    color: !isConnected ? "text-slate-400" : channelData?.isActive ? "text-emerald-600" : "text-amber-500",
    text: !isConnected ? "Disconnected" : channelData?.isActive ? "Healthy & Active" : "Inactive",
    icon: !isConnected ? "WifiOff" : channelData?.isActive ? "CheckCircle2" : "PauseCircle",
    bg: !isConnected ? "bg-slate-100" : channelData?.isActive ? "bg-emerald-50" : "bg-amber-50",
    border: !isConnected ? "border-slate-200" : channelData?.isActive ? "border-emerald-200" : "border-amber-200",
  };

  return (
    <div className={`border rounded-xl p-5 shadow-sm transition-colors ${statusConfig.bg} ${statusConfig.border}`}>
      
      {/* Header Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white border ${statusConfig.border}`}>
                <Icon name="Activity" size={20} className={statusConfig.color} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-800">Channel Health</h3>
                <p className="text-xs text-slate-500">System connectivity status</p>
            </div>
        </div>
        
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border ${statusConfig.border} ${statusConfig.color}`}>
          <Icon name={statusConfig.icon} size={14} />
          <span className="text-xs font-bold uppercase tracking-wide">{statusConfig.text}</span>
        </div>
      </div>

      {isConnected && channelData ? (
        <div className="space-y-5">
          
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 p-3 rounded-lg border border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Business Name</span>
                <p className="text-sm font-medium text-slate-800 truncate">{channelData?.businessName}</p>
            </div>
            <div className="bg-white/60 p-3 rounded-lg border border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">WhatsApp Number</span>
                <p className="text-sm font-medium text-slate-800 font-mono">
                    {channelData?.phoneNumber || "Auto-detecting..."}
                </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex divide-x divide-slate-200 border-t border-slate-200 pt-4">
             <div className="flex-1 text-center px-2">
                 <div className="text-2xl font-bold text-slate-700">{channelData?.stats?.messagesToday || 0}</div>
                 <div className="text-[10px] text-slate-500 font-medium uppercase">Msgs Today</div>
             </div>
             <div className="flex-1 text-center px-2">
                 <div className="text-2xl font-bold text-slate-700">{channelData?.stats?.activeChats || 0}</div>
                 <div className="text-[10px] text-slate-500 font-medium uppercase">Active Chats</div>
             </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleToggleChannel}
            disabled={isLoading}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2
                ${channelData?.isActive 
                    ? "bg-white border border-red-200 text-red-600 hover:bg-red-50" 
                    : "bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent"
                }`}
          >
            {isLoading ? (
                <Icon name="Loader2" size={16} className="animate-spin" />
            ) : (
                <Icon name={channelData?.isActive ? "Pause" : "Play"} size={16} />
            )}
            {channelData?.isActive ? "Pause Channel Processing" : "Activate Channel"}
          </button>

          {/* Last Sync Footnote */}
          <div className="text-center">
             <p className="text-[10px] text-slate-400">
                Last heartbeat: {channelData.lastSync ? new Date(channelData.lastSync).toLocaleTimeString() : "Waiting..."}
             </p>
          </div>

        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-6">
          <p className="text-sm text-slate-500 mb-1">No channel connected.</p>
          <p className="text-xs text-slate-400">Please select or connect a number to view health stats.</p>
        </div>
      )}
    </div>
  );
};

export default ChannelStatusCard;