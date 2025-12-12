// C:\Projects\WhatsAppBot_Rocket\src\pages\agent-inbox\components\MessageComposer.jsx
import React, { useState } from "react";
import Icon from "../../../components/AppIcon"; // Asegúrate de importar tu componente de Iconos

export default function MessageComposer({ disabled, onSend, error }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e?.preventDefault(); // El '?' protege si se llama sin evento
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  };

  // Manejador de teclado para UX de escritorio (Enter = Enviar)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 bg-white border-t border-slate-200">
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 bg-slate-100 p-1.5 rounded-3xl border border-transparent focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
      >
        <div className="flex-1 min-w-0">
          <textarea
            rows={1}
            className="w-full max-h-32 min-h-[40px] resize-none bg-transparent px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            placeholder="Type a message..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            style={{ fieldSizing: "content" }} // CSS moderno para auto-height (si el navegador lo soporta)
          />
        </div>
        
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="p-2.5 mb-0.5 mr-0.5 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none disabled:bg-slate-300 transition-all flex-shrink-0"
          title="Send Message"
        >
          {disabled ? (
             <Icon name="Loader2" size={18} className="animate-spin" />
          ) : (
             <Icon name="Send" size={18} className="ml-0.5" />
          )}
        </button>
      </form>
      
      {/* Mensaje de error discreto */}
      {error && (
        <div className="mt-2 text-[11px] text-red-500 flex items-center gap-1 px-2 animate-in slide-in-from-bottom-1">
          <Icon name="AlertCircle" size={12} />
          {String(error)}
        </div>
      )}
      
      <div className="text-[10px] text-slate-400 text-center mt-2 hidden md:block">
        Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for new line
      </div>
    </div>
  );
}