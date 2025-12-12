// C:\Projects\WhatsAppBot_Rocket\src\pages\flow-builder\components\FlowEditor.jsx

import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input"; // Asumiendo que soporta className
import Select from "../../../components/ui/Select"; // Asumiendo que soporta className

const FlowEditor = ({ flow = null, isOpen, onClose, onSave }) => {
  // --- LÓGICA DE ESTADO (INTACTA) ---
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "keyword",
    keywords: [],
    responses: [{ message: "", delay: 0 }],
    isActive: true,
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [errors, setErrors] = useState({});

  const triggerTypeOptions = [
    {
      value: "keyword",
      label: "Keyword Match",
      description: "Trigger when message contains specific words",
    },
    {
      value: "welcome",
      label: "Welcome Message",
      description: "First message sent to new users",
    },
    {
      value: "fallback",
      label: "Default Reply",
      description: "Sent when no other logic matches",
    },
  ];

  useEffect(() => {
    if (flow) {
      setFormData({
        name: flow?.name || "",
        description: flow?.description || "",
        triggerType: flow?.triggerType || "keyword",
        keywords: flow?.keywords || [],
        responses: flow?.responses || [{ message: "", delay: 0 }],
        isActive: flow?.isActive !== undefined ? flow?.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        triggerType: "keyword",
        keywords: [],
        responses: [{ message: "", delay: 0 }],
        isActive: true,
      });
    }
    setErrors({});
  }, [flow, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddKeyword = () => {
    if (
      keywordInput?.trim() &&
      !formData?.keywords
        ?.map((k) => k.toLowerCase())
        .includes(keywordInput.trim().toLowerCase())
    ) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev?.keywords, keywordInput.trim().toLowerCase()],
      }));
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (index) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev?.keywords?.filter((_, i) => i !== index),
    }));
  };

  const handleResponseChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      responses: prev?.responses?.map((response, i) =>
        i === index ? { ...response, [field]: value } : response
      ),
    }));
  };

  const handleAddResponse = () => {
    setFormData((prev) => ({
      ...prev,
      responses: [...prev?.responses, { message: "", delay: 0 }],
    }));
  };

  const handleRemoveResponse = (index) => {
    if (formData?.responses?.length > 1) {
      setFormData((prev) => ({
        ...prev,
        responses: prev?.responses?.filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData?.name?.trim()) newErrors.name = "Flow name is required.";
    if (formData?.triggerType === "keyword" && formData?.keywords?.length === 0) {
      newErrors.keywords = "Add at least one keyword.";
    }
    if (formData?.responses?.some((response) => !response?.message?.trim())) {
      newErrors.responses = "Response message cannot be empty.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const flowData = {
        ...formData,
        id: flow?.id || Date.now(),
        triggerCount: flow?.triggerCount || 0,
        lastUpdated: new Date().toLocaleDateString(),
      };
      onSave(flowData);
      onClose();
    }
  };

  if (!isOpen) return null;

  // --- RENDERIZADO VISUAL PRO ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop con Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Icon name={flow ? "Edit3" : "Plus"} size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  {flow ? "Edit Automation Flow" : "Create New Flow"}
                </h2>
                <p className="text-xs text-slate-500">Configure triggers and automated responses.</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* SECTION 1: BASIC INFO */}
          <section className="space-y-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                1. General Information
             </h3>
             <div className="grid gap-4">
                <Input
                  label="Flow Name"
                  placeholder="e.g. Pricing Inquiry"
                  value={formData?.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  error={errors?.name}
                  required
                  className="text-sm"
                />
                <Input
                  label="Description (Optional)"
                  placeholder="Briefly describe what this flow does..."
                  value={formData?.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="text-sm"
                />
             </div>
          </section>

          {/* SECTION 2: TRIGGER CONFIG */}
          <section className="space-y-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                2. Trigger Logic
             </h3>
             
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <Select
                  label="Trigger Type"
                  options={triggerTypeOptions}
                  value={formData?.triggerType}
                  onChange={(value) => handleInputChange("triggerType", value)}
                  className="mb-4 bg-white"
                />

                {/* Keyword Input Area */}
                {formData?.triggerType === "keyword" && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-medium text-slate-700">Keywords</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type keyword and press Enter..."
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                        className="flex-1 bg-white"
                      />
                      <Button variant="outline" onClick={handleAddKeyword} iconName="Plus">Add</Button>
                    </div>
                    
                    {/* Keyword Chips */}
                    <div className="flex flex-wrap gap-2 min-h-[32px] p-2 bg-white rounded-lg border border-slate-200 border-dashed">
                       {formData?.keywords?.length > 0 ? (
                          formData.keywords.map((keyword, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                               {keyword}
                               <button onClick={() => handleRemoveKeyword(index)} className="hover:text-purple-900 transition-colors">
                                  <Icon name="X" size={12} />
                               </button>
                            </span>
                          ))
                       ) : (
                          <span className="text-xs text-slate-400 italic p-1">No keywords added yet.</span>
                       )}
                    </div>
                    {errors?.keywords && <p className="text-xs text-red-500 mt-1">{errors.keywords}</p>}
                  </div>
                )}

                {/* Hint Text for other types */}
                {formData.triggerType !== "keyword" && (
                   <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg mt-2">
                      <Icon name="Info" size={16} className="mt-0.5 shrink-0" />
                      <p>This flow will trigger automatically based on conversation context, ignoring specific keywords.</p>
                   </div>
                )}
             </div>
          </section>

          {/* SECTION 3: RESPONSE BUILDER */}
          <section className="space-y-4">
             <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                   3. Bot Response
                </h3>
                <button onClick={handleAddResponse} className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                   <Icon name="Plus" size={14} /> Add Step
                </button>
             </div>

             <div className="space-y-4">
                {formData?.responses?.map((response, index) => (
                   <div key={index} className="relative pl-4 border-l-2 border-slate-200 group">
                      {/* Step Indicator */}
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-500">
                         {index + 1}
                      </div>

                      <div className="bg-slate-50 p-4 rounded-r-xl rounded-bl-xl border border-slate-200 relative">
                         {/* Remove Button */}
                         {formData.responses.length > 1 && (
                            <button 
                              onClick={() => handleRemoveResponse(index)}
                              className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                               <Icon name="Trash2" size={14} />
                            </button>
                         )}

                         <div className="space-y-3">
                            <div>
                               <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Message Text</label>
                               <textarea
                                  placeholder="Hi there! How can I help you today?"
                                  value={response?.message}
                                  onChange={(e) => handleResponseChange(index, "message", e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 min-h-[80px] resize-y"
                               />
                            </div>
                            <div className="w-1/3">
                               <Input
                                  type="number"
                                  label="Delay (seconds)"
                                  value={response?.delay}
                                  onChange={(e) => handleResponseChange(index, "delay", parseInt(e.target.value) || 0)}
                                  min={0}
                                  max={10}
                                  className="text-sm"
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
             {errors?.responses && <p className="text-xs text-red-500">{errors.responses}</p>}
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
           <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                 <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData?.isActive}
                    onChange={(e) => handleInputChange("isActive", e.target.checked)}
                 />
                 <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">Activate Immediately</span>
           </label>

           <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose} className="border-slate-300">Cancel</Button>
              <Button variant="default" onClick={handleSave} iconName="Save" className="bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200">
                 Save Flow
              </Button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default FlowEditor;