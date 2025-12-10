// supabase/functions/_shared/metaToken.ts
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Resuelve el token de Meta con prioridad: DB > Env Vars.
 * V2: Tolerante a duplicados (usa .limit(1)).
 */
export async function resolveMetaToken(
  supabase: SupabaseClient,
  tenantId: string,
  aliasOrId: string,
): Promise<string | null> {
  const aliasTrimmed = aliasOrId.trim();

  // 1️⃣ BUSQUEDA EN DB (Mejorada)
  // Usamos order + limit(1) + maybeSingle para evitar errores si hay duplicados.
  const { data, error } = await supabase
    .from("meta_tokens")
    .select("access_token")
    .eq("tenant_id", tenantId)
    .eq("provider", "facebook")
    .eq("alias", aliasTrimmed)
    .order("created_at", { ascending: false }) // Priorizar el más reciente
    .limit(1) // 👈 ESTO ES LA CLAVE: Asegura que solo traiga uno
    .maybeSingle();

  if (!error && data?.access_token) {
    return data.access_token;
  }

  // Debug: Si falló la DB, imprimimos por qué (solo para nosotros ver en logs)
  if (error) {
    console.warn("[metaToken] DB Query Warning:", error.message);
  }

  // 2️⃣ FALLBACK: Variables de Entorno
  const fixedMap: Record<string, string | undefined> = {
    meta_token_dm: Deno.env.get("META_TOKEN_DM"),
    meta_token_fea: Deno.env.get("META_TOKEN_FEA"),
  };

  if (fixedMap[aliasTrimmed]) {
    return fixedMap[aliasTrimmed] || null;
  }

  const envKey = "META_TOKEN__" + aliasTrimmed.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const val = Deno.env.get(envKey);

  if (val) return val;

  // Log final de fallo
  console.error(
    "[metaToken] Token NO encontrado. Tenant:", tenantId, "Alias:", aliasTrimmed
  );
  return null;
}