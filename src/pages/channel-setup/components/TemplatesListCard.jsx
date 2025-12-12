import React, { useState, useMemo } from "react";
import { sendTemplateMessage } from "../../../lib/templatesApi";
import Icon from "../../../components/AppIcon";

const categoryColors = {
  MARKETING: "bg-blue-50 text-blue-700 border-blue-200",
  UTILITY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  AUTHENTICATION: "bg-purple-50 text-purple-700 border-purple-200",
  SERVICE: "bg-orange-50 text-orange-700 border-orange-200",
};

const statusColors = {
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
  DISABLED: "bg-gray-100 text-gray-500 border-gray-200",
};

// Formateador de nombres bonito
const formatTemplateName = (rawName) => {
  if (!rawName) return "";
  let clean = rawName.replace(/_/g, " ");
  // Quita sufijos numéricos largos al final (ej: "_5547")
  clean = clean.replace(/[_\s]\d{3,}$/, ""); 
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

export default function TemplatesListCard({ templates, channelId }) {
  const [view, setView] = useState("LIST"); // 'LIST' | 'SEND'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Estado del filtro: 'active' (default), 'issues', 'all'
  const [filter, setFilter] = useState("active");

  // 1. Calculamos conteos para los badges de las pestañas
  const counts = useMemo(() => {
    return {
      active: templates.filter(t => t.status === 'APPROVED' || t.status === 'PENDING').length,
      issues: templates.filter(t => t.status === 'REJECTED' || t.status === 'DISABLED').length,
      all: templates.length
    };
  }, [templates]);

  // 2. Filtramos la lista según la pestaña seleccionada
  const filteredTemplates = templates.filter(t => {
    if (filter === 'active') return t.status === 'APPROVED' || t.status === 'PENDING';
    if (filter === 'issues') return t.status === 'REJECTED' || t.status === 'DISABLED';
    return true; // 'all'
  });

  const handleTestClick = (template) => {
    setSelectedTemplate(template);
    setView("SEND");
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setView("LIST");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
        
        <h3 className="font-bold text-slate-800 text-lg">
          {view === "LIST" ? "Message Templates" : "Test Template Message"}
        </h3>

        {/* 🔹 TABS DE FILTRO (Solo visibles en modo lista) */}
        {view === "LIST" && (
          <div className="flex p-1 bg-slate-200/60 rounded-lg">
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${
                filter === "active" 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Active
              <span className={`px-1.5 rounded-full text-[10px] ${filter === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-300 text-slate-600'}`}>
                {counts.active}
              </span>
            </button>

            <button
              onClick={() => setFilter("issues")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${
                filter === "issues" 
                  ? "bg-white text-red-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Issues
              {counts.issues > 0 && (
                <span className="px-1.5 rounded-full text-[10px] bg-red-100 text-red-600">
                  {counts.issues}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filter === "all" 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              All
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-0">
        {view === "LIST" ? (
          <TemplatesTable 
            templates={filteredTemplates} 
            onTest={handleTestClick} 
            currentFilter={filter}
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

// --- TABLA ---
function TemplatesTable({ templates, onTest, currentFilter }) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name={currentFilter === 'issues' ? "CheckCircle" : "Inbox"} size={24} className="text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">No templates found in this view.</p>
        <p className="text-xs text-slate-400 mt-1">
            {currentFilter === 'issues' ? "Great! No rejected templates." : "Try syncing from Meta or changing the filter."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 font-semibold">Name</th>
            <th className="px-6 py-3 font-semibold">Details</th>
            <th className="px-6 py-3 font-semibold">Status</th>
            <th className="px-6 py-3 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {templates.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
              {/* Name Column */}
              <td className="px-6 py-4">
                <div className="font-semibold text-slate-800">{formatTemplateName(t.name)}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 group-hover:text-indigo-500 transition-colors">
                    {t.name}
                </div>
              </td>

              {/* Details Column */}
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                    <span className={`text-[10px] w-fit px-2 py-0.5 rounded border font-semibold tracking-wide ${categoryColors[t.category] || "bg-gray-100"}`}>
                    {t.category}
                    </span>
                    <span className="text-xs text-slate-500 uppercase flex items-center gap-1">
                        <Icon name="Globe" size={10} /> {t.language}
                    </span>
                </div>
              </td>

              {/* Status Column */}
              <td className="px-6 py-4">
                <span className={`text-[10px] px-2 py-1 rounded border font-bold flex w-fit items-center gap-1.5 ${statusColors[t.status] || "bg-gray-100"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full 
                    ${t.status === 'APPROVED' ? 'bg-green-500' : 
                      t.status === 'REJECTED' ? 'bg-red-500' : 
                      t.status === 'PENDING' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'}
                  `}></div>
                  {t.status}
                </span>
                {t.status === 'REJECTED' && (
                    <div className="text-[10px] text-red-500 mt-1 max-w-[150px] leading-tight">
                        Check Meta Business Manager for details.
                    </div>
                )}
              </td>

              {/* Actions Column */}
              <td className="px-6 py-4 text-right">
                {t.status === 'APPROVED' ? (
                    <button
                    onClick={() => onTest(t)}
                    className="text-xs font-medium bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
                    >
                    Test Send
                    </button>
                ) : (
                    <span className="text-xs text-slate-400 italic px-2">Not ready</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- FORMULARIO DE ENVÍO (Igual que antes) ---
function TemplateSenderForm({ template, channelId, onCancel }) {
  const [phone, setPhone] = useState("");
  const [placeholders, setPlaceholders] = useState({});
  const [sending, setSending] = useState(false);

  const getBodyVariables = (text) => {
    const matches = text.match(/{{\d+}}/g);
    if (!matches) return [];
    const numbers = matches.map(m => parseInt(m.replace(/\D/g, '')));
    const max = Math.max(...numbers);
    return Array.from({ length: max }, (_, i) => i + 1);
  };

  const variableIndices = getBodyVariables(template.body);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!phone) return alert("Please enter a phone number");

    setSending(true);
    try {
      const components = [];
      if (variableIndices.length > 0) {
        const parameters = variableIndices.map(index => ({
          type: "text",
          text: placeholders[index] || "" 
        }));
        
        components.push({ type: "body", parameters: parameters });
      }

      const res = await sendTemplateMessage({
        channelId,
        to: phone,
        templateName: template.name,
        language: template.language,
        components
      });

      console.log("Send result:", res);
      if (res.ok || res.success) {
          alert("✅ Message sent successfully!");
          onCancel(); 
      } else {
          alert("❌ Error: " + JSON.stringify(res));
      }
    } catch (err) {
      console.error(err);
      alert("❌ System Error: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50/50 min-h-[300px]">
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                    <Icon name="ArrowLeft" size={18} className="text-slate-500"/>
                </button>
                <h4 className="text-lg font-bold text-slate-800">Send Template</h4>
            </div>
            <div className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded border border-green-200">
                LIVE MODE
            </div>
        </div>

        {/* Template Preview */}
        <div className="mb-6 bg-emerald-50/60 p-4 rounded-lg border border-emerald-100/80">
          <div className="flex justify-between mb-2">
             <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Preview</h5>
             <span className="text-[10px] text-emerald-600 font-mono">{template.name}</span>
          </div>
          <p className="text-sm text-emerald-900 whitespace-pre-wrap font-sans leading-relaxed">
            {template.body}
          </p>
        </div>

        <form onSubmit={handleSend} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
              Recipient Phone
            </label>
            <input
              type="tel"
              placeholder="e.g. 54911..."
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          {variableIndices.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-1">Dynamic Variables</h4>
              <div className="space-y-3">
                {variableIndices.map((index) => (
                  <div key={index}>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {`{{${index}}}`} Value
                    </label>
                    <input
                      type="text"
                      placeholder={`Enter content for {{${index}}}`}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:border-emerald-500 outline-none"
                      onChange={(e) => setPlaceholders(prev => ({ ...prev, [index]: e.target.value }))}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={sending}
              className="w-full px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 active:scale-95"
            >
              {sending ? (
                <>
                  <Icon name="Loader2" size={18} className="animate-spin" />
                  Sending Message...
                </>
              ) : (
                <>
                  <Icon name="Send" size={18} />
                  Send WhatsApp Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}