// supabase/functions/_shared/metaToken.ts

// Helper centralizado para resolver el access_token de Meta
// Soporta:
//  - Tokens legacy por ENV (DigitalMatch / FEA)
//  - Tokens guardados en tabla meta_tokens (por tenant + alias o por id)

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 🔐 Mapeos legacy / por ENV
function resolveEnvMetaToken(
  aliasOrId: string,
  tenantId?: string | null,
): string | null {
  const key = (aliasOrId || "").trim().toLowerCase();

  // 1) Aliases explícitos (por si algún canal usa estos)
  if (key === "meta_token_dm") {
    const val = Deno.env.get("META_TOKEN_DM");
    if (val) return val;
  }
  if (key === "meta_token_fea") {
    const val = Deno.env.get("META_TOKEN_FEA");
    if (val) return val;
  }

  // 2) Tenant-based legacy (hardcoded, para que DigitalMatch/FEA sigan funcionando)
  //    DigitalMatch
  if (tenantId === "2c46428a-ea58-4e70-87f5-bae9542becc1") {
    const val = Deno.env.get("META_TOKEN_DM");
    if (val) return val;
  }
  //    Fundación Evolución Antoniana (por si tuvieras también token por ENV)
  if (tenantId === "4c7afec9-2338-4bd4-baac-eee45827ebf5") {
    const val = Deno.env.get("META_TOKEN_FEA");
    if (val) return val;
  }

  // 3) Alias genérico → ENV del tipo META_TOKEN__ALIAS_NORMALIZADO
  //    ej: alias "default" → META_TOKEN__DEFAULT
  const envFromAlias =
    "META_TOKEN__" + key.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const valFromAlias = Deno.env.get(envFromAlias);
  if (valFromAlias) return valFromAlias;

  // 4) Tenant genérico → ENV del tipo META_TOKEN_TENANT__<TENANT_NORMALIZADO>
  if (tenantId) {
    const tenantKey =
      "META_TOKEN_TENANT__" +
      tenantId.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    const valFromTenant = Deno.env.get(tenantKey);
    if (valFromTenant) return valFromTenant;
  }

  return null;
}

// 🔐 Resolver access_token combinando ENV + tabla meta_tokens
export async function resolveMetaToken(
  supabase: any,
  tenantId: string,
  aliasOrId: string,
): Promise<string | null> {
  const key = (aliasOrId || "").trim() || "default";

  // 1) Primero intentamos por ENV (legacy / configuraciones manuales)
  const envToken = resolveEnvMetaToken(key, tenantId);
  if (envToken) {
    return envToken;
  }

  // 2) Si no hay ENV, buscamos en meta_tokens
  try {
    let query = supabase.from("meta_tokens").select("access_token");

    if (UUID_REGEX.test(key)) {
      // Si parece UUID → buscar por id
      query = query.eq("id", key);
    } else {
      // Si NO es UUID → buscar por alias + tenant + provider
      query = query
        .eq("tenant_id", tenantId)
        .eq("provider", "facebook")
        .eq("alias", key)
        .order("created_at", { ascending: false })
        .limit(1);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("[metaToken] error leyendo meta_tokens:", error);
      return null;
    }

    if (!data?.access_token) {
      console.warn(
        "[metaToken] no se encontró access_token en meta_tokens",
        {
          tenantId,
          key,
        },
      );
      return null;
    }

    return data.access_token as string;
  } catch (e) {
    console.error("[metaToken] excepción al leer meta_tokens:", e);
    return null;
  }
}
