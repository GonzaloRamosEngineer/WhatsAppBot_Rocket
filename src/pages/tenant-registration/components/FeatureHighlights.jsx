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

      {/* Trust Indicators */}
      <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <Icon name="Shield" size={16} className="text-emerald-400" />
          <span>SOC2 Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="Lock" size={16} className="text-emerald-400" />
          <span>End-to-End Encrypted</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="CheckCircle" size={16} className="text-emerald-400" />
          <span>99.9% Uptime</span>
        </div>
      </div>
    </div>
  );
};

export default FeatureHighlights;