// supabase/functions/_shared/metaToken.ts

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

function resolveEnvMetaToken(aliasOrId: string): string | null {
  const fixedMap: Record<string, string | undefined> = {
    meta_token_dm: Deno.env.get("META_TOKEN_DM"),
    meta_token_fea: Deno.env.get("META_TOKEN_FEA"),
    default: Deno.env.get("META_TOKEN_DM"), // si querés mapear "default" a DM
  };

  if (fixedMap[aliasOrId]) return fixedMap[aliasOrId] || null;

  const envKey =
    "META_TOKEN__" + aliasOrId.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const val = Deno.env.get(envKey);
  return val ?? null;
}

export async function resolveMetaToken(
  supabase: SupabaseClient,
  tenantId: string,
  aliasOrId: string,
): Promise<string | null> {
  const aliasTrimmed = aliasOrId.trim();

  // 1) Primero: variables de entorno (legacy / overrides)
  const envToken = resolveEnvMetaToken(aliasTrimmed);
  if (envToken) return envToken;

  // 2) meta_tokens por alias (NO asumas que es UUID)
  const { data, error } = await supabase
    .from("meta_tokens")
    .select("access_token")
    .eq("tenant_id", tenantId)
    .eq("provider", "facebook")
    .eq("alias", aliasTrimmed)
    .maybeSingle();

  if (error) {
    console.error("[metaToken] error leyendo meta_tokens:", error);
    return null;
  }

  if (!data?.access_token) {
    console.error(
      "[metaToken] Meta token not found for tenant",
      tenantId,
      "aliasOrId",
      aliasTrimmed,
    );
    return null;
  }

  return data.access_token;
}
