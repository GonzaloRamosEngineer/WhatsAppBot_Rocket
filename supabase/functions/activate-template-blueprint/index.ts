// C:\Projects\WhatsAppBot_Rocket\supabase\functions\activate-template-blueprint\index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Usamos tus variables de entorno estándar
const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- HELPER DE TOKEN ---
function resolveMetaToken(alias: string): string | null {
  const map: Record<string, string> = {
    meta_token_dm: Deno.env.get("META_TOKEN_DM") ?? "",
    meta_token_fea: Deno.env.get("META_TOKEN_FEA") ?? "",
  };
  if (map[alias]) return map[alias];

  const envKey =
    "META_TOKEN__" + alias.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const val = Deno.env.get(envKey);
  return val ?? null;
}

async function getMetaAccessToken(opts: {
  supabase: any;
  tenantId: string;
  tokenAlias?: string | null;
}): Promise<string | null> {
  const { supabase, tenantId } = opts;
  const alias = (opts.tokenAlias || "default").trim();

  // 1) Intentar env
  const envToken = resolveMetaToken(alias);
  if (envToken) return envToken;

  // 2) Buscar en meta_tokens
  const { data, error } = await supabase
    .from("meta_tokens")
    .select("access_token")
    .eq("tenant_id", tenantId)
    .eq("provider", "facebook")
    .eq("alias", alias)
    .maybeSingle();

  if (error) {
    console.error(
      "[activate-template] getMetaAccessToken error:",
      error,
      { tenantId, alias }
    );
    return null;
  }

  return data?.access_token ?? null;
}

serve(async (req) => {
  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  
  // Cliente Supabase
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });

  // 2. Verificar Usuario (Auth)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. Parse Body
  let body: { blueprintId?: string; channelId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { blueprintId, channelId } = body;

  if (!blueprintId || !channelId) {
    return new Response(
      JSON.stringify({ error: "blueprintId and channelId are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // A. Cargar Canal
    const { data: channel, error: chError } = await supabase
      .from("channels")
      .select("id, tenant_id, meta_waba_id, token_alias")
      .eq("id", channelId)
      .maybeSingle();

    if (chError || !channel) {
      return new Response(
        JSON.stringify({ error: "Channel not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // B. Verificar Membership
    const { data: membership, error: memberError } = await supabase
      .from("tenant_members")
      .select("tenant_id, role")
      .eq("tenant_id", channel.tenant_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !membership) {
        return new Response(JSON.stringify({ error: "Forbidden: You do not belong to this tenant" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!channel.meta_waba_id) {
        return new Response(JSON.stringify({ error: "Channel has no WABA ID configured" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // C. Cargar Blueprint
    const { data: bp, error: bpError } = await supabase
      .from("template_blueprints")
      .select("*")
      .eq("id", blueprintId)
      .maybeSingle();

    if (bpError || !bp) {
      return new Response(JSON.stringify({ error: "Blueprint not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // D. Obtener Token Meta
    const accessToken = await getMetaAccessToken({
      supabase,
      tenantId: channel.tenant_id,
      tokenAlias: channel.token_alias ?? null,
    });

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Meta access_token not found for this channel" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =====================================================================
    // E. Preparar Payload y Enviar a Meta (CON SUFIJO ALEATORIO)
    // =====================================================================
    
    // 1. Sanitizar nombre y AGREGAR SUFIJO RANDOM
    // Esto evita el error "Name already used with different category"
    const randomSuffix = Math.floor(Math.random() * 10000).toString();
    
    let safeName = bp.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 45); // Cortamos un poco para dejar espacio al sufijo
    
    safeName = `${safeName}_${randomSuffix}`; // Ej: bienvenida_socio_4821

    // 2. Corregir Categoría
    let safeCategory = (bp.category || "MARKETING").toUpperCase();
    if (safeCategory === "SERVICE") safeCategory = "UTILITY";

    // 3. Construir Componentes + EJEMPLOS AUTOMÁTICOS
    let metaComponents: any[] = [];
    
    if (bp.components && Array.isArray(bp.components) && bp.components.length > 0) {
        metaComponents = bp.components;
    } else if (bp.body) {
        const bodyComponent: any = {
            type: "BODY",
            text: bp.body
        };

        const variableMatches = bp.body.match(/\{\{\d+\}\}/g);
        
        if (variableMatches && variableMatches.length > 0) {
            const exampleValues = variableMatches.map((_: any, i: number) => `opcion_${i + 1}`);
            bodyComponent.example = {
                body_text: [ exampleValues ]
            };
        }

        metaComponents.push(bodyComponent);
    } else {
        throw new Error("Blueprint invalid: missing body or components");
    }

    const metaPayload = {
      name: safeName,
      category: safeCategory,
      language: bp.language || "es",
      components: metaComponents,
      allow_category_change: true
    };

    console.log("[activate-template] Sending to Meta:", JSON.stringify(metaPayload));

    // F. Enviar request a Meta
    const waRes = await fetch(
      `https://graph.facebook.com/v20.0/${channel.meta_waba_id}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metaPayload),
      }
    );

    const waJson = await waRes.json();

    if (!waRes.ok) {
      console.error("[activate-template] Meta Error:", waJson);
      return new Response(
        JSON.stringify({
          error: "Meta API Error",
          details: waJson.error?.message || waJson,
          metaPayload 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // G. Guardar en DB Local (templates)
    const { data: inserted, error: insertError } = await supabase
      .from("templates")
      .insert({
        tenant_id: channel.tenant_id,
        channel_id: channelId,
        name: safeName,
        language: metaPayload.language,
        category: safeCategory,
        body: bp.body,
        status: "APPROVED",
        definition: waJson,
        components: metaComponents,
        external_id: waJson.id,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("[activate-template] DB Insert Error:", insertError);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        template: inserted,
        meta: waJson,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e: any) {
    console.error("[activate-template] Unexpected Error:", e);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});