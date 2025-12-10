// supabase/functions/_shared/metaToken.ts
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Resuelve el token de Meta con esta prioridad:
 * 1) DB: meta_tokens (tenant_id + alias)
 * 2) ENV: claves fijas o META_TOKEN__ALIAS
 */
export async function resolveMetaToken(
  supabase: SupabaseClient,
  tenantId: string,
  aliasOrId: string,
): Promise<string | null> {
  const aliasTrimmed = aliasOrId.trim();

  // 1️⃣ PRIMERO: buscar en meta_tokens del tenant
  const { data, error } = await supabase
    .from("meta_tokens")
    .select("access_token")
    .eq("tenant_id", tenantId)
    .eq("provider", "facebook")
    .eq("alias", aliasTrimmed)
    .maybeSingle();

  if (!error && data?.access_token) {
    return data.access_token;
  }

  // 2️⃣ FALLBACK: variables de entorno (solo para casos especiales / dev)
  const fixedMap: Record<string, string | undefined> = {
    meta_token_dm: Deno.env.get("META_TOKEN_DM") ?? undefined,
    meta_token_fea: Deno.env.get("META_TOKEN_FEA") ?? undefined,
    // ❌ OJO: NO poner "default": META_TOKEN_DM acá
    // default: Deno.env.get("META_TOKEN_DM"),
  };

  if (fixedMap[aliasTrimmed]) {
    return fixedMap[aliasTrimmed] || null;
  }

  // 3️⃣ Alias como nombre de env dinámico
  const envKey =
    "META_TOKEN__" + aliasTrimmed.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const val = Deno.env.get(envKey);
  if (val) return val;

  // 4️⃣ Log de ayuda si es "default" y no encontramos nada
  if (aliasTrimmed === "default") {
    console.warn(
      `[metaToken] Warning: Alias 'default' no encontrado en DB para tenant ${tenantId}.`,
    );
  }

  console.error(
    "[metaToken] Token no encontrado. Tenant:",
    tenantId,
    "Alias:",
    aliasTrimmed,
  );
  return null;
}
