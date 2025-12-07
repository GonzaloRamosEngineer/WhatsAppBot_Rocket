// C:\Projects\WhatsAppBot_Rocket\src\lib\useSyncTemplates.js

import { useState } from "react";
import { useAuth } from "./AuthProvider";

/**
 * Hook para sincronizar plantillas de WhatsApp (Meta) usando
 * la Edge Function `whatsapp-sync-templates`.
 *
 * Usa supabase.functions.invoke → llama directamente a:
 * https://<project>.functions.supabase.co/whatsapp-sync-templates
 */
export function useSyncTemplates() {
  const { supabase } = useAuth();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Dispara la sync para un canal concreto.
   * @param {string} channelId
   * @param {{ dryRun?: boolean }} options
   */
  async function sync(channelId, { dryRun = false } = {}) {
    if (!supabase) {
      console.error("[useSyncTemplates] supabase no está disponible");
      return null;
    }

    if (!channelId) {
      console.error("[useSyncTemplates] falta channelId para sincronizar");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "whatsapp-sync-templates",
        {
          body: {
            channelId,
            dryRun,
          },
        }
      );

      if (error) {
        console.error("[useSyncTemplates] error en invoke", error);
        setError(error.message || "Error al sincronizar plantillas");
        return null;
      }

      // data viene de tu función Edge: { ok, found, synced, skipped }
      setResult(data);
      return data;
    } catch (err) {
      console.error("[useSyncTemplates] error inesperado", err);
      setError(err.message || "Error inesperado al sincronizar plantillas");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, result, error, sync };
}
