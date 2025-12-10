// supabase/functions/_shared/metaToken.ts

/**
 * Tipo genérico súper simple para no pelear con tipos de supabase-js.
 * Cualquier cliente que tenga .from() nos sirve.
 */
export type GenericSupabaseClient = {
  from: (table: string) => {
    select: (...args: any[]) => any;
    eq: (...args: any[]) => any;
    or: (...args: any[]) => any;
    order: (...args: any[]) => any;
    limit: (...args: any[]) => any;
    maybeSingle: () => Promise<{ data: any | null; error: any | null }>;
  };
};

/**
 * Mapa de aliases legacy que leen directamente variables de entorno.
 * Lo usamos para no romper la compatibilidad con META_TOKEN_DM, META_TOKEN_FEA, etc.
 */
const LEGACY_ALIAS_MAP: Record<string, string> = {
  meta_token_dm: Deno.env.get("META_TOKEN_DM") ?? "",
  meta_token_fea: Deno.env.get("META_TOKEN_FEA") ?? "",
};

/**
 * Resolver el access_token de Meta combinando:
 *
 * 1) Variables de entorno legacy:
 *    - META_TOKEN_DM, META_TOKEN_FEA
 *    - META_TOKEN__ALIAS_NORMALIZADO
 *
 * 2) Tabla meta_tokens:
 *    - primero por alias
 *    - fallback: por id (porque en algunos lugares usamos id como alias)
 */
export async function resolveMetaToken(
  supabase: GenericSupabaseClient | null,
  tenantId: string | null | undefined,
  rawAlias: string | null | undefined,
): Promise<string | null> {
  const alias = (rawAlias ?? "default").trim();

  if (!alias && !tenantId) return null;

  // 1) Modo legacy: alias -> variables fijas
  if (LEGACY_ALIAS_MAP[alias]) {
    const val = LEGACY_ALIAS_MAP[alias];
    if (val) return val;
  }

  // 2) Modo env dinámico: META_TOKEN__ALIAS_NORMALIZADO
  const envKey =
    "META_TOKEN__" + alias.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const envVal = Deno.env.get(envKey);
  if (envVal) return envVal;

  // 3) Si no tenemos supabase o tenant, hasta acá llegamos
  if (!supabase || !tenantId) return null;

  try {
    // 4) Buscar en meta_tokens (por alias o por id) para ese tenant
    const { data, error } = await supabase
      .from("meta_tokens")
      .select("access_token")
      .eq("tenant_id", tenantId)
      .or(`alias.eq.${alias},id.eq.${alias}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[metaToken] error leyendo meta_tokens:", error);
      return null;
    }

    return data?.access_token ?? null;
  } catch (e) {
    console.error("[metaToken] excepción leyendo meta_tokens:", e);
    return null;
  }
}
