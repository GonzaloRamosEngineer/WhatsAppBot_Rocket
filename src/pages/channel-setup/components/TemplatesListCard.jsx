import React, { useState } from "react";
import { sendTemplateMessage } from "../../../lib/templatesApi"; 
// Asegúrate de importar Toast o usar window.alert si no tienes sistema de notificaciones
// import { toast } from "sonner"; 

const categoryColors = {
  MARKETING: "bg-blue-100 text-blue-800 border-blue-200",
  UTILITY: "bg-emerald-100 text-emerald-800 border-emerald-200",
  AUTHENTICATION: "bg-purple-100 text-purple-800 border-purple-200",
  SERVICE: "bg-orange-100 text-orange-800 border-orange-200",
};

const statusColors = {
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export default function TemplatesListCard({ templates, channelId }) { // Recibimos channelId para poder enviar
  const [view, setView] = useState("LIST"); // 'LIST' | 'SEND'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Handlers
  const handleTestClick = (template) => {
    setSelectedTemplate(template);
    setView("SEND");
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setView("LIST");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800 text-lg">
          {view === "LIST" ? "Message Templates" : "Test Template Message"}
        </h3>
        {view === "LIST" && (
           <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
             {templates.length} synced
           </span>
        )}
      </div>

      {/* Content Body */}
      <div className="p-0">
        {view === "LIST" ? (
          <TemplatesTable 
            templates={templates} 
            onTest={handleTestClick} 
          />
        ) : (
          <TemplateSenderForm 
            template={selectedTemplate} 
            channelId={channelId}
            onCancel={handleBack} 
          />
        )}
      </div>
    </div>
  );
}

// --- Sub-component: Table View ---
function TemplatesTable({ templates, onTest }) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-slate-400 mb-2 text-4xl">📭</div>
        <p className="text-slate-500 font-medium">No templates synced yet.</p>
        <p className="text-sm text-slate-400">Click "Sync from Meta" to load your templates.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 font-semibold">Template Name</th>
            <th className="px-6 py-3 font-semibold">Category</th>
            <th className="px-6 py-3 font-semibold">Language</th>
            <th className="px-6 py-3 font-semibold">Status</th>
            <th className="px-6 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {templates.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-900">{t.name}</td>
              <td className="px-6 py-4">
                <span className={`text-[10px] px-2 py-1 rounded border font-semibold tracking-wide ${categoryColors[t.category] || "bg-gray-100"}`}>
                  {t.category}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-500">{t.language}</td>
              <td className="px-6 py-4">
                <span className={`text-[10px] px-2 py-1 rounded border font-bold ${statusColors[t.status] || "bg-gray-100"}`}>
                  {t.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onTest(t)}
                  disabled={t.status !== 'APPROVED'}
                  className={`text-xs font-medium px-3 py-1.5 rounded transition-colors border
                    ${t.status === 'APPROVED' 
                      ? "text-indigo-600 border-indigo-200 hover:bg-indigo-50 cursor-pointer" 
                      : "text-slate-300 border-slate-200 cursor-not-allowed"
                    }`}
                >
                  {t.status === 'APPROVED' ? "Select & Test" : "Not Ready"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Sub-component: Sending Form (The Critical Part for Meta) ---
function TemplateSenderForm({ template, channelId, onCancel }) {
  const [phone, setPhone] = useState("");
  const [placeholders, setPlaceholders] = useState({});
  const [sending, setSending] = useState(false);

  // 1. Extract variable count from Body (e.g. "Hello {{1}}, your code is {{2}}")
  // Using Regex to find max number in {{x}}
  const getBodyVariables = (text) => {
    const matches = text.match(/{{\d+}}/g);
    if (!matches) return [];
    const numbers = matches.map(m => parseInt(m.replace(/\D/g, '')));
    const max = Math.max(...numbers);
    // Return array [1, 2, ..., max]
    return Array.from({ length: max }, (_, i) => i + 1);
  };

  const variableIndices = getBodyVariables(template.body);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!phone) return alert("Please enter a phone number");

    setSending(true);
    try {
      // Build components array for Meta API
      const components = [];
      
      // If we have body variables, add them
      if (variableIndices.length > 0) {
        const parameters = variableIndices.map(index => ({
          type: "text",
          text: placeholders[index] || "" // Value from input
        }));
        
        components.push({
          type: "body",
          parameters: parameters
        });
      }

      const res = await sendTemplateMessage({
        channelId,
        to: phone,
        templateName: template.name,
        language: template.language,
        components
      });

      console.log("Send result:", res);
      alert("✅ Message sent successfully! Check WhatsApp.");
      onCancel(); // Go back to list
    } catch (err) {
      console.error(err);
      alert("❌ Error sending message: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50/50">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        
        {/* Template Preview */}
        <div className="mb-6 bg-emerald-50 p-4 rounded-md border border-emerald-100">
          <h5 className="text-xs font-bold text-emerald-800 uppercase mb-2 tracking-wider">Template Preview</h5>
          <p className="text-sm text-emerald-900 whitespace-pre-wrap font-sans">
            {template.body}
          </p>
        </div>

        <form onSubmit={handleSend} className="space-y-5">
          {/* Destination Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Recipient Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. 5491122334455"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <p className="text-xs text-slate-400 mt-1">Include country code (no + symbol required usually, depends on provider)</p>
          </div>

          {/* Dynamic Inputs for Placeholders */}
          {variableIndices.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Body Variables</h4>
              <div className="grid gap-3">
                {variableIndices.map((index) => (
                  <div key={index}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Variable {`{{${index}}}`}
                    </label>
                    <input
                      type="text"
                      placeholder={`Value for {{${index}}}`}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:border-emerald-500 outline-none"
                      onChange={(e) => setPlaceholders(prev => ({ ...prev, [index]: e.target.value }))}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 shadow-sm transition flex justify-center items-center"
            >
              {sending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}