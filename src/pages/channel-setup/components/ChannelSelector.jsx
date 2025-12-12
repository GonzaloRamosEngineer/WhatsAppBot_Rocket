// C:\Projects\WhatsAppBot_Rocket\src\pages\channel-setup\components\ChannelSelector.jsx
import React from "react";
import Icon from "../../../components/AppIcon";

const ChannelSelector = ({
  channels,
  selectedChannelId,
  onSelectChannel,
}) => {
  const hasChannels = channels && channels.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-100 p-1.5 rounded-md">
            <Icon name="Phone" size={18} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Connected Numbers
            </h2>
          </div>
        </div>
      </div>

      {hasChannels ? (
        <div className="flex flex-col gap-2 mb-4">
          {channels.map((channel) => {
            const isSelected = channel.id === selectedChannelId;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelectChannel(channel.id)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-lg border text-sm transition-all ${
                  isSelected
                    ? "bg-slate-800 text-white border-slate-800 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                    <Icon
                    name="MessageCircle"
                    size={16}
                    className={isSelected ? "text-emerald-400" : "text-slate-400"}
                    />
                    <span className="truncate font-medium">
                    {channel.display_name || "Unnamed Number"}
                    </span>
                </div>
                
                {channel.status === "active" && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isSelected ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 px-2 bg-slate-50 rounded-lg border border-dashed border-slate-200 mb-4">
             <p className="text-xs text-slate-500">
                No WhatsApp numbers configured yet.
            </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => onSelectChannel(null)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-slate-300 text-slate-500 text-xs font-medium hover:bg-slate-50 hover:text-slate-700 transition-colors"
      >
        <Icon name="Plus" size={14} />
        {hasChannels ? "Connect Another Number" : "Connect First Number"}
      </button>
    </div>
  );
};

export default ChannelSelector;