// C:\Projects\WhatsAppBot_Rocket\src\pages\channel-setup\components\CredentialsForm.jsx
import React, { useState } from "react";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const emptyCreds = {
  phoneNumberId: "",
  wabaId: "",
  accessToken: "",
  businessName: "",
};

const CredentialsForm = ({ credentials, onCredentialsChange, onSave, isLoading }) => {
  const [errors, setErrors] = useState({});
  const [showToken, setShowToken] = useState(false);

  const current = credentials || emptyCreds;

  const handleInputChange = (field, value) => {
    const updated = { ...current, [field]: value };
    if (onCredentialsChange) onCredentialsChange(updated);
    if (errors?.[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!current?.phoneNumberId?.trim()) {
      newErrors.phoneNumberId = "Phone Number ID is required";
    } else if (!/^\d{5,20}$/.test(current.phoneNumberId)) {
      newErrors.phoneNumberId = "Phone Number ID must be numeric";
    }

    if (!current?.wabaId?.trim()) {
      newErrors.wabaId = "WABA ID is required";
    } else if (!/^(\d{5,20}|waba_\d{5,30})$/.test(current.wabaId)) {
      newErrors.wabaId = "WABA ID must be numeric or start with 'waba_'";
    }

    if (!current?.accessToken?.trim()) {
      newErrors.accessToken = "Access Token is required";
    } else if (current.accessToken.length < 50) {
      newErrors.accessToken = "Access Token seems too short (invalid)";
    }

    if (!current?.businessName?.trim()) {
      newErrors.businessName = "Business Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm() && onSave) {
      onSave(current);
    }
  };

  const instructionSteps = [
    {
      title: "Get Phone Number ID",
      description: "Go to Meta Business Manager → WhatsApp Manager → Phone Numbers → Select number → Copy Phone Number ID.",
    },
    {
      title: "Get WABA ID",
      description: "In WhatsApp Manager, find your WhatsApp Business Account ID (top of the page).",
    },
    {
      title: "Generate Access Token",
      description: "Go to Meta for Developers → Your App → WhatsApp → Getting Started → Generate a permanent token.",
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
          <Icon name="Key" size={20} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">API Credentials</h3>
          <p className="text-sm text-slate-500">Manual configuration for Meta Graph API.</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Icon name="Info" size={16} />
          How to get these IDs?
        </h4>
        <div className="space-y-3">
          {instructionSteps.map((step, index) => (
            <div key={index} className="text-xs">
              <span className="font-semibold text-slate-800">{step.title}: </span>
              <span className="text-slate-500">{step.description}</span>
            </div>
          ))}
        </div>
        <a
          href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 mt-3"
        >
          <span>View official setup guide</span>
          <Icon name="ExternalLink" size={12} />
        </a>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        <Input
          label="Business Display Name"
          type="text"
          placeholder="e.g. Acme Corp"
          value={current.businessName}
          onChange={(e) => handleInputChange("businessName", e.target.value)}
          error={errors?.businessName}
          required
          description="The name visible to your customers."
        />

        <Input
          label="Phone Number ID"
          type="text"
          placeholder="e.g. 10005550001"
          value={current.phoneNumberId}
          onChange={(e) => handleInputChange("phoneNumberId", e.target.value)}
          error={errors?.phoneNumberId}
          required
          description="Numeric ID for the specific phone number."
        />

        <Input
          label="WABA ID (WhatsApp Business Account ID)"
          type="text"
          placeholder="e.g. 20005550002"
          value={current.wabaId}
          onChange={(e) => handleInputChange("wabaId", e.target.value)}
          error={errors?.wabaId}
          required
          description="Numeric ID for your Business Account."
        />

        <div className="relative">
          <Input
            label="System User Access Token"
            type={showToken ? "text" : "password"}
            placeholder="EAABwzLixnjY..."
            value={current.accessToken}
            onChange={(e) => handleInputChange("accessToken", e.target.value)}
            error={errors?.accessToken}
            required
            description="Permanent token with 'whatsapp_business_messaging' permission."
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
          >
            <Icon name={showToken ? "EyeOff" : "Eye"} size={16} />
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 p-3 bg-emerald-50/50 border border-emerald-100 rounded-md flex gap-3">
        <Icon name="Shield" size={18} className="text-emerald-600 mt-0.5" />
        <div>
           <p className="text-xs text-emerald-800 font-medium">Secure Storage</p>
           <p className="text-[11px] text-emerald-600">Credentials are encrypted. We never log your access tokens.</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          loading={isLoading}
          iconName="Save"
          iconPosition="left"
          disabled={!current.phoneNumberId || !current.wabaId || !current.accessToken || !current.businessName}
        >
          {isLoading ? "Saving..." : "Save Credentials"}
        </Button>
      </div>
    </div>
  );
};

export default CredentialsForm;