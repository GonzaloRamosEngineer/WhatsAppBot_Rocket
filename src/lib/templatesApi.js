// C:\Projects\WhatsAppBot_Rocket\src\lib\templatesApi.js

import { supabase } from "./supabaseClient";

/**
 * Sincroniza templates de Meta para un canal específico.
 * Internamente llama a la Edge Function: whatsapp-sync-templates
 *
 * @param {string} channelId - ID del canal (UUID en tabla channels)
 * @param {Object} [options]
 * @param {boolean} [options.dryRun=false] - Si true, no upsertea en DB, solo simula.
 */
export async function syncMetaTemplates(channelId, { dryRun = false } = {}) {
  if (!channelId) {
    throw new Error("channelId is required for syncMetaTemplates");
  }

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
    console.error("[templatesApi] syncMetaTemplates error:", error);
    throw error;
  }

  return data; // { found, synced, skipped: { ... }, dryRun }
}

/**
 * Lista templates desde la tabla public.templates
 * Filtra por channel_id (recomendado) + categoría + status.
 *
 * RLS garantiza que solo veas las del tenant del usuario.
 */
export async function listTemplates({
  channelId,
  category,
  status,
  limit = 100,
  offset = 0,
} = {}) {
  let query = supabase.from("templates").select("*", { count: "exact" });

  if (channelId) {
    query = query.eq("channel_id", channelId);
  }

  if (category && category !== "ALL") {
    query = query.eq("category", category);
  }

  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }

  query = query
    .order("category", { ascending: true })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[templatesApi] listTemplates error:", error);
    throw error;
  }

  return { templates: data ?? [], total: count ?? 0 };
}

/**
 * Devuelve el catálogo de categorías oficiales (tabla template_categories)
 * Sirve para armar filtros en la UI (combos, chips, etc.).
 */
export async function listTemplateCategories() {
  const { data, error } = await supabase
    .from("template_categories")
    .select("code, label")
    .order("code", { ascending: true });

  if (error) {
    console.error("[templatesApi] listTemplateCategories error:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Obtiene un template específico por ID (UUID de tabla templates).
 */
export async function getTemplateById(templateId) {
  if (!templateId) {
    throw new Error("templateId is required for getTemplateById");
  }

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  if (error) {
    console.error("[templatesApi] getTemplateById error:", error);
    throw error;
  }

  return data;
}
