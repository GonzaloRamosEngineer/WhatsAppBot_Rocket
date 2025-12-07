// C:\Projects\WhatsAppBot_Rocket\src\lib\useActivateTemplateBlueprint.js

import { useState } from "react";
import { useAuth } from "./AuthProvider";

/**
 * Hook para activar un blueprint (crear plantilla en Meta).
 */
export function useActivateTemplateBlueprint() {
  const { supabase } = useAuth();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function activate(blueprintId, channelId) {
    if (!supabase) {
      console.error("[useActivateTemplateBlueprint] falta supabase");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "activate-template-blueprint",
        {
          body: { blueprintId, channelId }
        }
      );

      if (error) {
        console.error("[activate-template-blueprint] error:", error);
        setError(error.message || "Error al activar la plantilla");
        return null;
      }

      setResult(data);
      return data;
    } catch (err) {
      console.error("[activate-template-blueprint] unexpected:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, result, activate };
}
