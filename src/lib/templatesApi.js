// C:\Projects\WhatsAppBot_Rocket\src\lib\templatesApi.js

import { supabase } from "./supabaseClient";

/**
 * Sincroniza templates de Meta para un canal específico.
 * Internamente llama a la Edge Function: whatsapp-sync-templates
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
 * Devuelve el catálogo de categorías oficiales
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
 * Obtiene un template específico por ID
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

/**
 * NUEVA VERSIÓN CORREGIDA: Envía un mensaje de plantilla usando el ID.
 * Se conecta con la lógica robusta de 'whatsapp-send-message'.
 */
export async function sendTemplateMessage({ channelId, to, templateId, templateVariables }) {
  // Validamos lo básico
  if (!channelId || !to || !templateId) {
    throw new Error("Missing required parameters: channelId, to, or templateId");
  }

  // Estructura payload para nuestro Backend Inteligente
  const payload = {
    channelId: channelId,       // Para saber qué canal usar
    to: to,                     // El teléfono del cliente
    templateId: templateId,     // El UUID de la tabla 'templates'
    templateVariables: templateVariables // Objeto simple: { body: ['Var1', 'Var2'], header: [...] }
  };

  const { data, error } = await supabase.functions.invoke("whatsapp-send-message", {
    body: payload
  });

  if (error) {
    console.error("[templatesApi] sendTemplateMessage error:", error);
    // Intentamos parsear el error si viene como JSON string en el mensaje
    try {
        const errBody = JSON.parse(error.message);
        throw new Error(errBody.error || error.message);
    } catch {
        throw error;
    }
  }

  return data;
}