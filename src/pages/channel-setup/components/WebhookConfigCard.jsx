// C:\Projects\WhatsAppBot_Rocket\src\pages\channel-setup\components\WebhookConfigCard.jsx
import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Icon from "../../../components/AppIcon";

const WebhookConfigCard = () => {
  const [copied, setCopied] = useState(false);
  const webhookUrl = `${window.location?.origin}/api/webhooks/whatsapp`;
  const verifyToken = "whatsapp_webhook_verify_token_2024";

  const handleCopyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const configSteps = [
    {
      step: 1,
      title: "Go to Meta Business Manager",
      description: "Navigate to your WhatsApp API configuration console.",
      link: "https://business.facebook.com",
    },
    {
      step: 2,
      title: "Configure Webhook URL",
      description: "Paste the URL below into the Webhooks configuration.",
    },
    {
      step: 3,
      title: "Set Verify Token",
      description: "Use the exact token below to validate the connection.",
    },
    {
      step: 4,
      title: "Subscribe to Events",
      description: "Enable 'messages' and 'message_status' events.",
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center border border-pink-100">
          <Icon name="Webhook" size={20} className="text-pink-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Webhook Configuration</h3>
          <p className="text-sm text-slate-500">Receive real-time messages and status updates.</p>
        </div>
      </div>

      {/* Steps */}
      <div className="mb-6 space-y-4">
        {configSteps.map((step) => (
          <div key={step.step} className="flex gap-3">
            <div className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 border border-slate-200">
              {step.step}
            </div>
            <div>
              <h5 className="text-sm font-semibold text-slate-800">{step.title}</h5>
              <p className="text-xs text-slate-500">{step.description}</p>
              {step.link && (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-1 font-medium"
                >
                  <span>Open Meta Manager</span>
                  <Icon name="ExternalLink" size={10} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Callback URL</label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={webhookUrl}
              readOnly
              className="flex-1 font-mono text-xs bg-white"
            />
            <Button
              variant="outline"
              size="sm"
              iconName={copied === "url" ? "Check" : "Copy"}
              onClick={() => handleCopyToClipboard(webhookUrl, "url")}
            >
              {copied === "url" ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Verify Token</label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={verifyToken}
              readOnly
              className="flex-1 font-mono text-xs bg-white"
            />
            <Button
              variant="outline"
              size="sm"
              iconName={copied === "token" ? "Check" : "Copy"}
              onClick={() => handleCopyToClipboard(verifyToken, "token")}
            >
              {copied === "token" ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookConfigCard;