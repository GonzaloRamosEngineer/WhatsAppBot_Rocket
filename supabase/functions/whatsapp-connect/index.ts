// supabase/functions/whatsapp-connect/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: { headers: { Authorization: authHeader } },
  });

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

  let body: {
    tenantId?: string;
    wabaId?: string;
    phoneId?: string;
    displayPhoneNumber?: string;
    tokenAlias?: string;
    channelName?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const {
    tenantId,
    wabaId,
    phoneId,
    displayPhoneNumber,
    tokenAlias,
    channelName,
  } = body;

  if (!tenantId || !wabaId || !phoneId || !displayPhoneNumber || !tokenAlias) {
    return new Response(
      JSON.stringify({
        error:
          "tenantId, wabaId, phoneId, displayPhoneNumber and tokenAlias are required",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const normalizedPhone = displayPhoneNumber.replace(/\s+/g, "");

  try {
    // Verificar que el usuario sea owner/admin del tenant
    const { data: membership, error: memberError } = await supabase
      .from("tenant_members")
      .select("tenant_id, role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .maybeSingle();

    if (memberError) {
      console.error("Error checking membership:", memberError);
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

    // Upsert canal
    const { data: channelData, error: channelError } = await supabase
      .from("channels")
      .upsert(
        {
          tenant_id: tenantId,
          type: "whatsapp",
          display_name: channelName ?? "WhatsApp Principal",
          phone: normalizedPhone,
          meta_waba_id: wabaId,
          phone_id: phoneId,
          token_alias: tokenAlias,
          status: "active",
        },
        { onConflict: "tenant_id,type,phone_id" },
      )
      .select()
      .single();

    if (channelError) {
      console.error("Error upserting channel:", channelError);
      return new Response(
        JSON.stringify({ error: "Failed to create/update channel" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Bot default
    let bot: any = null;
    {
      const { data: existingBot } = await supabase
        .from("bots")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingBot) {
        bot = existingBot;
      } else {
        const { data: newBot, error: botError } = await supabase
          .from("bots")
          .insert({
            tenant_id: tenantId,
            mode: "bot-first",
            engine: "rules",
            name: "Bot Default",
          })
          .select()
          .single();
        if (!botError) bot = newBot;
        else console.error("Error creating bot:", botError);
      }
    }

    // Flow default
    if (bot?.id) {
      const { data: existingFlow } = await supabase
        .from("flows")
        .select("id")
        .eq("bot_id", bot.id)
        .eq("key", "default")
        .maybeSingle();

      if (!existingFlow) {
        const def = {
          version: 1,
          nodes: [
            { id: "start", type: "start" },
            {
              id: "saludo",
              type: "message",
              text: "Hola! Ya te vamos a atender 🙌",
            },
            {
              id: "fallback",
              type: "message",
              text: "No entendí. Escribí MENU para opciones.",
            },
          ],
          edges: [
            { from: "start", to: "saludo" },
            { from: "saludo", to: "fallback", on: "*" },
          ],
        };

        const { error: flowError } = await supabase
          .from("flows")
          .insert({
            bot_id: bot.id,
            key: "default",
            definition: def,
          });

        if (flowError) {
          console.error("Error creating default flow:", flowError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        channel: channelData,
        bot: bot ? { id: bot.id, name: bot.name } : null,
        flow: { key: "default" },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("Unexpected error whatsapp-connect:", e);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
