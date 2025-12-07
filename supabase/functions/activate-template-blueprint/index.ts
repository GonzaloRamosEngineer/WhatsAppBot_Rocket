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

// ----------------------------------------------
// Tipos auxiliares (solo para claridad mental)
// ----------------------------------------------
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

  // Cliente Supabase con service_role (igual que en whatsapp-send-message)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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
      console.error("[activate-template-blueprint] channel error:", channelError);
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
    // 4) Resolver access_token de Meta (OAuth tabla meta_tokens)
    // -------------------------
    const { data: tokenRow, error: tokenError } = await supabase
      .from("meta_tokens")
      .select("access_token")
      .eq("tenant_id", channel.tenant_id)
      .eq("provider", "facebook")
      .maybeSingle();

    if (tokenError) {
      console.error(
        "[activate-template-blueprint] meta_tokens error:",
        tokenError,
      );
      return new Response(
        JSON.stringify({ error: "Failed to load Meta token" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!tokenRow?.access_token) {
      return new Response(
        JSON.stringify({
          error:
            "No Meta access_token found for this tenant in meta_tokens",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const accessToken = tokenRow.access_token;

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
        status: "PENDING", // cuando Meta la apruebe, whatsapp-sync-templates la actualizará a APPROVED
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
