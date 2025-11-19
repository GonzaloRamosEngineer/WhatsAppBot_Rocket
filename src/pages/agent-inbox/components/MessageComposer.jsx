// src/pages/agent-inbox/components/MessageComposer.jsx
import React, { useState } from "react";

export default function MessageComposer({ disabled, onSend, error }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 px-3 py-2 bg-muted/30"
    >
      <div className="flex-1">
        <textarea
          rows={1}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Escribí un mensaje para enviar por WhatsApp..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
        />
        {error && (
          <div className="mt-1 text-[11px] text-red-500">
            {String(error)}
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        Enviar
      </button>
    </form>
  );
}
