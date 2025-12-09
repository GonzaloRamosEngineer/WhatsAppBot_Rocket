// C:\Projects\WhatsAppBot_Rocket\supabase\functions\activate-template-blueprint\index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Tipos auxiliares (solo para claridad)
type TemplateBlueprint = {
  id: string;
  sector: string;
  use_case: string;
  name: string;
  category: string;
  language: string;
  body: string;
  components: any | null;
  variables: any | null;
};

// Reutilizamos la misma idea de alias -> token (env + DB)
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

  // 2) Buscar en meta_tokens por tenant + provider + alias
  const { data, error } = await supabase
    .from("meta_tokens")
    .select("access_token")
    .eq("tenant_id", tenantId)
    .eq("provider", "facebook")
    .eq("alias", alias)
    .maybeSingle();

  if (error) {
    console.error(
      "[activate-template-blueprint] getMetaAccessToken meta_tokens error:",
      error,
      { tenantId, alias },
    );
    return null;
  }

  return data?.access_token ?? null;
}

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
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
  const hasUserAuth = !!authHeader;

  // Cliente Supabase con service_role
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: {
      headers: hasUserAuth ? { Authorization: authHeader } : {},
    },
  });

  let user: { id: string } | null = null;

  if (hasUserAuth) {
    const {
      data: { user: supaUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !supaUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    user = { id: supaUser.id };
  }

  // -------------------------
  // 1) Parseo de body
  // -------------------------
  let body: {
    blueprintId?: string;
    channelId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { blueprintId, channelId } = body;

  if (!blueprintId || !channelId) {
    return new Response(
      JSON.stringify({
        error: "blueprintId and channelId are required",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // -------------------------
    // 2) Cargar canal
    // -------------------------
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("id, tenant_id, meta_waba_id, token_alias")
      .eq("id", channelId)
      .maybeSingle();

    if (channelError) {
      console.error(
        "[activate-template-blueprint] channel error:",
        channelError,
      );
      return new Response(
        JSON.stringify({ error: "Failed to load channel" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!channel) {
      return new Response(
        JSON.stringify({ error: "Channel not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!channel.meta_waba_id) {
      return new Response(
        JSON.stringify({
          error: "Channel has no meta_waba_id configured",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // -------------------------
    // 2.1) Verificar membership (si viene de usuario real)
    // -------------------------
    if (user) {
      const { data: membership, error: memberError } = await supabase
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("tenant_id", channel.tenant_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError) {
        console.error(
          "[activate-template-blueprint] error checking membership:",
          memberError,
        );
        return new Response(
          JSON.stringify({ error: "Failed to check membership" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (!membership) {
        return new Response(
          JSON.stringify({ error: "Forbidden for this tenant" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // -------------------------
    // 3) Cargar blueprint
    // -------------------------
    const { data: bp, error: bpError } = await supabase
      .from("template_blueprints")
      .select("*")
      .eq("id", blueprintId)
      .maybeSingle<TemplateBlueprint>();

    if (bpError) {
      console.error(
        "[activate-template-blueprint] blueprint error:",
        bpError,
      );
      return new Response(
        JSON.stringify({ error: "Failed to load template blueprint" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!bp) {
      return new Response(
        JSON.stringify({ error: "Template blueprint not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // -------------------------
    // 4) Resolver access_token de Meta
    // -------------------------
    const accessToken = await getMetaAccessToken({
      supabase,
      tenantId: channel.tenant_id,
      tokenAlias: channel.token_alias ?? null,
    });

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          error:
            "No Meta access_token configured for this tenant/alias (env o meta_tokens)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // -------------------------
    // 5) Armar payload para crear template en Meta
    // -------------------------

    // name: en snake_case, minúsculas, sin espacios
    const safeName = bp.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const category = (bp.category || "MARKETING").toUpperCase();
    const language = bp.language || "es";

    // Si el blueprint trae components, los usamos; si no, creamos uno básico de BODY
    const components = bp.components && Array.isArray(bp.components)
      ? bp.components
      : [
          {
            type: "BODY",
            text: bp.body,
          },
        ];

    const metaPayload = {
      name: safeName,
      category,
      language,
      components,
    };

    // -------------------------
    // 6) POST a Graph API
    // -------------------------
    const waRes = await fetch(
      `https://graph.facebook.com/v20.0/${channel.meta_waba_id}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metaPayload),
      },
    );

    const waJson = await waRes.json();

    if (!waRes.ok) {
      console.error(
        "[activate-template-blueprint] Meta error:",
        waRes.status,
        waJson,
      );
      return new Response(
        JSON.stringify({
          error: "Meta API error creating template",
          details: waJson,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const externalId = waJson.id ?? null;

    // -------------------------
    // 7) Insertar en tabla templates
    // -------------------------
    const { data: inserted, error: insertError } = await supabase
      .from("templates")
      .insert({
        tenant_id: channel.tenant_id,
        channel_id: channelId,
        name: safeName,
        language,
        category,
        body: bp.body,
        status: "PENDING", // whatsapp-sync-templates la actualizará a APPROVED
        definition: metaPayload,
        external_id: externalId,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error(
        "[activate-template-blueprint] insert templates error:",
        insertError,
      );
      // Aunque falle el insert, devolvemos el resultado de Meta para debug
      return new Response(
        JSON.stringify({
          error: "Template created in Meta but failed to save in DB",
          details: insertError,
          meta: waJson,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // -------------------------
    // 8) OK
    // -------------------------
    return new Response(
      JSON.stringify({
        ok: true,
        template: inserted,
        meta: waJson,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error(
      "[activate-template-blueprint] Unexpected error:",
      e,
    );
    return new Response(
      JSON.stringify({
        error: "Unexpected error",
        details: String(e),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
