// supabase/functions/whatsapp-send-message/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 🔐 Mismo patrón que en whatsapp-webhook
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

  // 🔐 Validar usuario
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

  // 📦 Body
  let body: {
    conversationId?: string;
    text?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { conversationId, text } = body;
  const messageText = (text ?? "").trim();

  if (!conversationId || !messageText) {
    return new Response(
      JSON.stringify({
        error: "conversationId and text are required",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // 1) Obtener conversación + canal asociado
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select(
        `
        id,
        tenant_id,
        channel_id,
        contact_phone,
        status,
        assigned_agent,
        channels (
          id,
          phone_id,
          token_alias
        )
      `,
      )
      .eq("id", conversationId)
      .maybeSingle();

    if (convError) {
      console.error("Error fetching conversation:", convError);
      return new Response(
        JSON.stringify({ error: "Failed to load conversation" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!conv) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const channel = conv.channels;
    if (!channel || !channel.phone_id) {
      return new Response(
        JSON.stringify({ error: "Channel for conversation is invalid" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2) Verificar que el usuario tenga membership en el tenant
    const { data: membership, error: memberError } = await supabase
      .from("tenant_members")
      .select("tenant_id, role")
      .eq("tenant_id", conv.tenant_id)
      .eq("user_id", user.id)
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

    // 3) Resolver token de Meta
    const tokenAlias = channel.token_alias ?? "";
    const metaToken = resolveMetaToken(tokenAlias);

    if (!metaToken) {
      return new Response(
        JSON.stringify({
          error: "Meta token not configured for this channel",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 4) Enviar mensaje a WhatsApp Cloud
    const waRes = await fetch(
      `https://graph.facebook.com/v20.0/${channel.phone_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: conv.contact_phone,
          text: { body: messageText },
        }),
      },
    );

    const waJson = await waRes.json();

    if (!waRes.ok) {
      console.error("WhatsApp API error:", waRes.status, waJson);
      return new Response(
        JSON.stringify({
          error: "WhatsApp API error",
          details: waJson,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 5) Insertar mensaje en tabla messages
    const { data: newMsg, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conv.id,
        tenant_id: conv.tenant_id,
        channel_id: conv.channel_id,
        direction: "out", // 👈 consistente con whatsapp-webhook
        sender: user.id,
        body: messageText,
        meta: {
          via: "agent",
          sent_by: user.id,
          whatsapp_response: waJson,
        },
      })
      .select()
      .single();

    if (msgError) {
      console.error("Error inserting message:", msgError);
      return new Response(
        JSON.stringify({ error: "Failed to insert message" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 6) Actualizar conversación (last_message_at, status, assigned_agent)
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        status: conv.status === "pending_agent" ? "open" : conv.status,
        assigned_agent: conv.assigned_agent ?? user.id,
      })
      .eq("id", conv.id);

    return new Response(
      JSON.stringify({
        message: newMsg,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("Unexpected error whatsapp-send-message:", e);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
