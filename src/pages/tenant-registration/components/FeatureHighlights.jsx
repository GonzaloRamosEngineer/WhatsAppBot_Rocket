// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-registration\components\FeatureHighlights.jsx

import React from "react";
import Icon from "../../../components/AppIcon";

const FeatureHighlights = () => {
  const features = [
    {
      icon: "MessageCircle",
      title: "Automated Responses",
      description: "Setup intelligent flows to handle customer queries 24/7 without human intervention.",
    },
    {
      icon: "BarChart3",
      title: "Advanced Analytics",
      description: "Track message volume, response times, and customer satisfaction in real-time.",
    },
    {
      icon: "Users",
      title: "Multi-Agent Support",
      description: "Collaborate with your team. Assign conversations and manage roles efficiently.",
    },
    {
      icon: "Zap",
      title: "Instant Integration",
      description: "Connect your WhatsApp Business number in seconds with our verified Meta partnership.",
    },
  ];

  return (
    <div className="text-white">
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-3">Why choose MatchBot?</h2>
        <p className="text-slate-400 text-lg">
          Everything you need to scale your WhatsApp support and sales.
        </p>
      </div>

      <div className="grid gap-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/5">
              <Icon name={feature.icon} size={24} className="text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-200 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Indicators & Certifications */}
      <div className="mt-12 pt-8 border-t border-white/10">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">
          Official Certifications & Security
        </p>
        
        <div className="flex flex-wrap gap-4 text-sm text-slate-300 items-center">
          
          {/* EL BADGE ESTRELLA: Meta Tech Provider */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 shadow-sm backdrop-blur-md transition-transform hover:scale-105 cursor-default">
            <Icon name="BadgeCheck" size={18} className="text-[#3897f0]" /> {/* Azul Meta */}
            <span className="font-semibold text-white">Meta Tech Provider</span>
          </div>

          {/* Otros indicadores más sutiles */}
          <div className="flex items-center gap-2 px-2">
            <Icon name="Lock" size={16} className="text-emerald-400" />
            <span>E2E Encrypted</span>
          </div>
          
          <div className="flex items-center gap-2 px-2">
            <Icon name="Server" size={16} className="text-purple-400" />
            <span>99.9% Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureHighlights;