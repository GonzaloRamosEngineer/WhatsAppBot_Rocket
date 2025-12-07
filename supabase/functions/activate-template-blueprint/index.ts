// supabase/functions/activate-template-blueprint/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // 🔁 Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed, use POST" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let payloadBody: { blueprintId?: string; channelId?: string };
    try {
      payloadBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { blueprintId, channelId } = payloadBody;

    if (!blueprintId || !channelId) {
      return new Response(
        JSON.stringify({
          error: "Missing params: blueprintId and channelId are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 1️⃣ Cargar blueprint
    const { data: bp, error: bpErr } = await supabase
      .from("template_blueprints")
      .select("*")
      .eq("id", blueprintId)
      .single();

    if (bpErr || !bp) {
      console.error("[activate-template-blueprint] blueprint error", bpErr);
      return new Response(
        JSON.stringify({ error: "Blueprint not found", details: bpErr }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2️⃣ Resolver canal + tenant
    const { data: channel, error: chErr } = await supabase
      .from("channels")
      .select("id, tenant_id, meta_waba_id, display_name")
      .eq("id", channelId)
      .single();

    if (chErr || !channel) {
      console.error("[activate-template-blueprint] channel error", chErr);
      return new Response(
        JSON.stringify({ error: "Channel not found", details: chErr }),
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

    // 3️⃣ Obtener access_token de Meta para el tenant (provider = facebook)
    const { data: tokenRow, error: tokenErr } = await supabase
      .from("meta_tokens")
      .select("access_token")
      .eq("tenant_id", channel.tenant_id)
      .eq("provider", "facebook")
      .single();

    if (tokenErr || !tokenRow?.access_token) {
      console.error("[activate-template-blueprint] token error", tokenErr);
      return new Response(
        JSON.stringify({
          error:
            "No Meta access_token found for this tenant. Connect with Meta first.",
          details: tokenErr,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const accessToken = tokenRow.access_token;

    // 4️⃣ Armar payload para Meta
    const normalizedName = bp.name.toLowerCase().replace(/\s+/g, "_");

    const templatePayload = {
      name: normalizedName,
      category: String(bp.category || "").toUpperCase(), // MARKETING / UTILITY / SERVICE / AUTHENTICATION
      language: bp.language || "es",
      components: [
        {
          type: "BODY",
          text: bp.body,
        },
      ],
    };

    // 5️⃣ Llamar a Meta → crear plantilla
    const metaUrl = `https://graph.facebook.com/v20.0/${channel.meta_waba_id}/message_templates`;

    const resMeta = await fetch(metaUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(templatePayload),
    });

    const metaResponse = await resMeta.json().catch(() => ({} as any));

    if (!resMeta.ok) {
      console.error("[activate-template-blueprint] Meta error", resMeta.status, metaResponse);
      return new Response(
        JSON.stringify({
          error: "Meta API error",
          status: resMeta.status,
          metaResponse,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 6️⃣ Guardar template en DB (status PENDING hasta próxima sync oficial)
    await supabase.from("templates").insert({
      tenant_id: channel.tenant_id,
      channel_id: channel.id,
      name: templatePayload.name,
      language: templatePayload.language,
      category: templatePayload.category,
      body: bp.body,
      status: "PENDING",
      definition: templatePayload,
      external_id: metaResponse.id ?? null,
      last_synced_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        blueprintId,
        channelId,
        metaResponse,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[activate-template-blueprint] unexpected error", err);
    const message =
      err && typeof err === "object" && "message" in err
        ? (err as any).message
        : String(err);

    return new Response(
      JSON.stringify({
        error: "Unexpected error",
        message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
