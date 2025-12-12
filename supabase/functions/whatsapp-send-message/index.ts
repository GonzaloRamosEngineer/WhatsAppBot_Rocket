// supabase/functions/whatsapp-send-message/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveMetaToken } from "../_shared/metaToken.ts";

const SUPABASE_URL =
  Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE =
  Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders: Record<string, string> = {
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
  const hasUserAuth = !!authHeader;

  // Cliente Supabase con Service Role para operaciones internas
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: {
      headers: hasUserAuth ? { Authorization: authHeader } : {},
    },
  });

  // Parseamos el body
  let body: {
    conversationId?: string;
    channelId?: string; // NUEVO: Para envíos directos
    to?: string;        // NUEVO: Teléfono destino para envíos directos
    text?: string;
    templateId?: string;
    templateVariables?: {
      header?: string[];
      body?: string[];
    };
    meta?: Record<string, unknown>;
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
    conversationId: paramConvId,
    channelId: paramChanId,
    to: paramTo,
    text,
    templateId,
    templateVariables,
    meta: extraMeta,
  } = body;

  const messageText = (text ?? "").trim();
  const isTemplateMode = !!templateId;
  const isTextMode = !!messageText;

  // VALIDACIÓN INICIAL
  // Debe haber un conversationId O (channelId + to)
  if (!paramConvId && (!paramChanId || !paramTo)) {
    return new Response(
      JSON.stringify({ error: "conversationId OR (channelId + to) is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!isTemplateMode && !isTextMode) {
    return new Response(
      JSON.stringify({
        error: "Either text or templateId must be provided",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Identificar Usuario (si viene auth)
  let user: { id: string } | null = null;
  if (hasUserAuth) {
    const {
      data: { user: supaUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !supaUser) {
      console.error("whatsapp-send-message: getUser error", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    user = { id: supaUser.id };
  }

  try {
    // ----------------------------------------------------------------------
    // 1) RESOLVER CONVERSACIÓN Y CANAL (La lógica "Híbrida")
    // ----------------------------------------------------------------------
    let conv: any = null;

    if (paramConvId) {
      // CASO A: Tenemos ID de conversación (Flujo existente)
      const { data: existingConv, error: convError } = await supabase
        .from("conversations")
        .select(`
          id, tenant_id, channel_id, contact_phone, status, assigned_agent,
          channels ( id, phone_id, token_alias )
        `)
        .eq("id", paramConvId)
        .maybeSingle();

      if (convError) throw new Error(`Error fetching conversation: ${convError.message}`);
      if (!existingConv) throw new Error("Conversation not found");
      
      conv = existingConv;

    } else {
      // CASO B: Envio directo (channelId + to) -> Buscar o Crear Conversación
      // Primero obtenemos el canal para saber el tenant_id
      const { data: channelData, error: chanError } = await supabase
        .from("channels")
        .select("id, tenant_id, phone_id, token_alias")
        .eq("id", paramChanId)
        .single();

      if (chanError || !channelData) throw new Error("Channel not found");

      // Buscamos si ya existe conversación para este número en este canal
      const { data: existingConv, error: searchError } = await supabase
        .from("conversations")
        .select(`
           id, tenant_id, channel_id, contact_phone, status, assigned_agent
        `)
        .eq("channel_id", channelData.id)
        .eq("contact_phone", paramTo)
        .maybeSingle();

      if (searchError) throw new Error(`Error searching conversation: ${searchError.message}`);

      if (existingConv) {
        // Ya existía, la usamos y le adjuntamos el canal manualmente (para mantener formato)
        conv = { ...existingConv, channels: channelData };
      } else {
        // NO existe -> LA CREAMOS (Aquí está la magia)
        console.log(`Creating new conversation for ${paramTo} on channel ${channelData.id}`);
        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({
            tenant_id: channelData.tenant_id,
            channel_id: channelData.id,
            contact_phone: paramTo,
            status: "open", // La abrimos directamente
            unread_count: 0,
          })
          .select()
          .single();

        if (createError) throw new Error(`Failed to create conversation: ${createError.message}`);
        
        // Estructura unificada
        conv = { ...newConv, channels: channelData };
      }
    }

    // Validación final de que tenemos canal válido
    const channel = conv.channels;
    if (!channel || !channel.phone_id) {
      throw new Error("Channel configuration invalid (missing phone_id)");
    }

    // ----------------------------------------------------------------------
    // 2) VERIFICAR PERMISOS (Tenant Membership)
    // ----------------------------------------------------------------------
    if (user) {
      const { data: membership, error: memberError } = await supabase
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("tenant_id", conv.tenant_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !membership) {
        return new Response(
          JSON.stringify({ error: "Forbidden: You are not a member of this tenant" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // ----------------------------------------------------------------------
    // 3) TOKEN DE META
    // ----------------------------------------------------------------------
    const aliasOrId = channel.token_alias ?? "default";
    const metaToken = await resolveMetaToken(supabase, conv.tenant_id, aliasOrId);

    if (!metaToken) {
      throw new Error(`Meta token not found for tenant ${conv.tenant_id}`);
    }

    // ----------------------------------------------------------------------
    // 4) CONSTRUIR PAYLOAD WHATSAPP
    // ----------------------------------------------------------------------
    let waPayload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: conv.contact_phone,
    };

    let dbBody = messageText;
    let templateMeta: Record<string, unknown> | null = null;

    if (isTemplateMode) {
      // LÓGICA DE PLANTILLA
      const { data: template, error: tplError } = await supabase
        .from("templates")
        .select("*")
        .eq("id", templateId)
        .maybeSingle();

      if (tplError || !template) throw new Error("Template not found or error loading it");
      if (template.tenant_id !== conv.tenant_id) throw new Error("Template belongs to another tenant");
      if (template.status !== "APPROVED") throw new Error(`Template is not approved (Status: ${template.status})`);

      const vars = templateVariables ?? {};
      const components: any[] = [];

      if (vars.header && vars.header.length > 0) {
        components.push({
          type: "header",
          parameters: vars.header.map((v) => ({ type: "text", text: String(v) })),
        });
      }
      if (vars.body && vars.body.length > 0) {
        components.push({
          type: "body",
          parameters: vars.body.map((v) => ({ type: "text", text: String(v) })),
        });
      }

      waPayload = {
        ...waPayload,
        type: "template",
        template: {
          name: template.name,
          language: { code: template.language },
          components: components.length > 0 ? components : undefined,
        },
      };

      dbBody = `[TEMPLATE] ${template.name}`;
      templateMeta = {
        id: template.id,
        name: template.name,
        variables: vars,
      };

    } else {
      // LÓGICA DE TEXTO SIMPLE
      waPayload = {
        ...waPayload,
        type: "text",
        text: { body: messageText },
      };
    }

    // ----------------------------------------------------------------------
    // 5) ENVIAR A META API
    // ----------------------------------------------------------------------
    const waRes = await fetch(
      `https://graph.facebook.com/v20.0/${channel.phone_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(waPayload),
      },
    );

    const waJson = await waRes.json();

    if (!waRes.ok) {
      console.error("WhatsApp API Error:", waJson);
      return new Response(
        JSON.stringify({ error: "WhatsApp API error", details: waJson }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ----------------------------------------------------------------------
    // 6) GUARDAR EN LA BASE DE DATOS (MESSAGES)
    // ----------------------------------------------------------------------
    const metaPayload: Record<string, unknown> = {
      via: user ? "agent" : "system",
      sent_by: user ? user.id : "system",
      ...(extraMeta || {}),
      whatsapp_response: waJson,
    };
    if (templateMeta) metaPayload.whatsapp_template = templateMeta;

    const { data: newMsg, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conv.id, // Aquí usamos el ID (ya sea existente o nuevo)
        tenant_id: conv.tenant_id,
        channel_id: conv.channel_id,
        direction: "out",
        sender: user ? user.id : "system",
        body: dbBody,
        meta: metaPayload,
      })
      .select()
      .single();

    if (msgError) throw new Error(`Failed to insert message: ${msgError.message}`);

    // ----------------------------------------------------------------------
    // 7) ACTUALIZAR CONVERSACIÓN
    // ----------------------------------------------------------------------
    const nextAssignedAgent = user
      ? conv.assigned_agent ?? user.id
      : conv.assigned_agent ?? null;

    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        status: conv.status === "pending_agent" ? "open" : conv.status,
        assigned_agent: nextAssignedAgent,
      })
      .eq("id", conv.id);

    return new Response(
      JSON.stringify({ message: newMsg, conversationId: conv.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );

  } catch (e: any) {
    console.error("Error in whatsapp-send-message:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});