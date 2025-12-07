import { serve } from "http/server";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { blueprintId, channelId } = await req.json();

    if (!blueprintId || !channelId)
      return new Response("Missing params", { status: 400 });

    // 1. Cargar blueprint
    const { data: bp, error: bpErr } = await supabase
      .from("template_blueprints")
      .select("*")
      .eq("id", blueprintId)
      .single();

    if (bpErr) throw bpErr;

    // 2. Resolver canal + token
    const { data: channel } = await supabase
      .from("channels")
      .select("meta_waba_id, tenant_id, token_alias")
      .eq("id", channelId)
      .single();

    const { data: tokenRow } = await supabase
      .from("meta_tokens")
      .select("access_token")
      .eq("tenant_id", channel.tenant_id)
      .eq("provider", "facebook")
      .single();

    // 3. Armar payload Meta
    const payload = {
      name: bp.name.toLowerCase().replace(/\s+/g, "_"),
      category: bp.category.toUpperCase(),
      language: bp.language,
      components: [
        {
          type: "BODY",
          text: bp.body,
        },
      ],
    };

    // 4. Llamar a Meta
    const resMeta = await fetch(
      `https://graph.facebook.com/v20.0/${channel.meta_waba_id}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenRow.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const metaResponse = await resMeta.json();

    // 5. Guardar template en DB
    await supabase.from("templates").insert({
      tenant_id: channel.tenant_id,
      channel_id: channelId,
      name: payload.name,
      language: payload.language,
      category: payload.category,
      body: bp.body,
      status: "PENDING",
      definition: payload,
      external_id: metaResponse.id ?? null,
      last_synced_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify(metaResponse), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});
