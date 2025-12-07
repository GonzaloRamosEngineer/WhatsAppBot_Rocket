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

    // Blueprint
    const { data: bp, error: bpErr } = await supabase
      .from("template_blueprints")
      .select("*")
      .eq("id", blueprintId)
      .single();
    if (bpErr) throw bpErr;

    // Canal → necesito waba + tenant
    const { data: channel } = await supabase
      .from("channels")
      .select("meta_waba_id, tenant_id")
      .eq("id", channelId)
      .single();

    // Token del tenant
    const { data: tokenRow } = await supabase
      .from("meta_tokens")
      .select("access_token")
      .eq("tenant_id", channel.tenant_id)
      .eq("provider", "facebook")
      .single();

    const uniqueName =
      bp.name.toLowerCase().replace(/\s+/g, "_") +
      "_" +
      crypto.randomUUID().slice(0, 6);

    const components = [
      {
        type: "BODY",
        text: bp.body
      }
    ];

    // Enviar a Meta
    const resMeta = await fetch(
      `https://graph.facebook.com/v20.0/${channel.meta_waba_id}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenRow.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: uniqueName,
          category: bp.category.toUpperCase(),
          language: bp.language,
          components
        })
      }
    );

    const metaResponse = await resMeta.json();

    // Guardar en DB
    await supabase.from("templates").insert({
      tenant_id: channel.tenant_id,
      channel_id: channelId,
      name: uniqueName,
      language: bp.language,
      category: bp.category.toUpperCase(),
      body: bp.body,
      status: "PENDING",
      definition: {
        name: uniqueName,
        components
      },
      external_id: metaResponse.id ?? null,
      last_synced_at: new Date().toISOString()
    });

    return new Response(JSON.stringify(metaResponse), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500
    });
  }
});
