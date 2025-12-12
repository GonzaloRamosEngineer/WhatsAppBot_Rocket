// C:\Projects\WhatsAppBot_Rocket\src\pages\channel-setup\components\TroubleshootingCard.jsx
import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const TroubleshootingCard = () => {
  const [expandedItem, setExpandedItem] = useState(null);

  const troubleshootingItems = [
    {
      id: "invalid-credentials",
      title: "Invalid Credentials Error",
      description: "Connection test fails due to authentication.",
      solution: `Verify your Phone Number ID and WABA ID are correct.\nCheck if the Access Token is expired.\nEnsure the app has 'whatsapp_business_messaging' permission.\nConfirm the number is verified in Meta Business Manager.`,
      icon: "Key",
    },
    {
      id: "webhook-not-receiving",
      title: "Webhook Not Receiving Messages",
      description: "Messages do not appear in the dashboard.",
      solution: `Check Webhook URL in Meta Business Manager.\nVerify the 'Verify Token' matches exactly.\nEnsure subscriptions to 'messages' are active.\nTest endpoint accessibility from external networks.`,
      icon: "Webhook",
    },
    {
      id: "rate-limits",
      title: "API Rate Limits",
      description: "Calls are rejected due to excess volume.",
      solution: `Check current usage in Meta Dashboard.\nImplement queues for high volume.\nConsider upgrading your Business Verification level.\nMonitor rate-limit headers in API responses.`,
      icon: "Clock",
    },
    {
      id: "message-delivery",
      title: "Message Delivery Issues",
      description: "Messages stuck in pending or failing.",
      solution: `Check recipient number format (must include country code).\nConfirm your business is approved for messaging.\nIf using templates, ensure they are APPROVED.\nCheck if content violates WhatsApp Policy.`,
      icon: "MessageCircle",
    },
  ];

  const toggleExpanded = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const contactSupport = () => {
    window.open("mailto:support@matchbot.com?subject=Channel%20Setup%20Help", "_blank");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
          <Icon name="HelpCircle" size={20} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Troubleshooting Guide</h3>
          <p className="text-sm text-slate-500">Common issues and solutions.</p>
        </div>
      </div>

      <div className="space-y-3">
        {troubleshootingItems.map((item) => (
          <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpanded(item.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Icon name={item.icon} size={18} className="text-slate-400" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">{item.title}</h4>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
              <Icon
                name={expandedItem === item.id ? "ChevronUp" : "ChevronDown"}
                size={16}
                className="text-slate-400"
              />
            </button>

            {expandedItem === item.id && (
              <div className="px-4 pb-4 bg-slate-50/50">
                <div className="pl-8 pt-2 border-l-2 border-slate-200 ml-2">
                  <h5 className="text-xs font-bold text-slate-700 mb-2 uppercase">Solution:</h5>
                  <div className="text-sm text-slate-600 space-y-1">
                    {item.solution.split("\n").map((line, index) => (
                      <p key={index} className="flex gap-2">
                        <span className="text-slate-400">•</span> {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
        <div>
           <h4 className="text-sm font-bold text-slate-700">Still stuck?</h4>
           <p className="text-xs text-slate-500">Our team can help verify your Meta setup.</p>
        </div>
        <Button variant="outline" size="sm" onClick={contactSupport} iconName="Mail" iconPosition="left">
           Contact Support
        </Button>
      </div>
    </div>
  );
};

export default TroubleshootingCard;