import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveMetaToken } from "../_shared/metaToken.ts";


const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};


// type TemplateVariables = {
//   header?: string[];
//   body?: string[];
// };

// type SendMessagePayload = {
//   conversationId?: string;
//   text?: string;
//   templateId?: string;
//   templateVariables?: TemplateVariables;
//   meta?: Record<string, unknown>;
// };

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

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: {
      headers: hasUserAuth ? { Authorization: authHeader } : {},
    },
  });

  let body: {
    conversationId?: string;
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
    conversationId,
    text,
    templateId,
    templateVariables,
    meta: extraMeta,
  } = body;

  const messageText = (text ?? "").trim();
  const isTemplateMode = !!templateId;
  const isTextMode = !!messageText;

  if (!conversationId) {
    return new Response(
      JSON.stringify({ error: "conversationId is required" }),
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

  // Usuario (solo si viene con Authorization)
  let user: { id: string } | null = null;

  if (hasUserAuth) {
    const {
      data: { user: supaUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !supaUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    user = { id: supaUser.id };
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

    // 2) Verificar membership SOLO si viene de un usuario real
    if (user) {
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
    }

    // 3) Resolver token de Meta (env + meta_tokens, alias o id)
    const metaToken = await resolveMetaToken(
      supabase,
      conv.tenant_id,
      channel.token_alias ?? "default",
    );


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

    // 4) Construir payload para WhatsApp Cloud
    let waPayload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: conv.contact_phone,
    };

    let dbBody = messageText;
    let templateMeta: Record<string, unknown> | null = null;

    if (isTemplateMode) {
      // MODO TEMPLATE
      const { data: template, error: tplError } = await supabase
        .from("templates")
        .select(
          `
          id,
          tenant_id,
          name,
          language,
          category,
          status
        `,
        )
        .eq("id", templateId)
        .maybeSingle();

      if (tplError) {
        console.error("Error fetching template:", tplError);
        return new Response(
          JSON.stringify({ error: "Failed to load template" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (!template) {
        return new Response(
          JSON.stringify({ error: "Template not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (template.tenant_id !== conv.tenant_id) {
        return new Response(
          JSON.stringify({ error: "Template does not belong to this tenant" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const status = (template.status ?? "").toUpperCase();
      if (status && status !== "APPROVED") {
        return new Response(
          JSON.stringify({
            error: "Template is not approved",
            templateStatus: template.status,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const vars = templateVariables ?? {};
      const components: any[] = [];

      if (vars.header && vars.header.length > 0) {
        components.push({
          type: "header",
          parameters: vars.header.map((v) => ({
            type: "text",
            text: String(v),
          })),
        });
      }

      if (vars.body && vars.body.length > 0) {
        components.push({
          type: "body",
          parameters: vars.body.map((v) => ({
            type: "text",
            text: String(v),
          })),
        });
      }

      const templatePayload: any = {
        name: template.name,
        language: {
          code: template.language,
        },
      };

      if (components.length > 0) {
        templatePayload.components = components;
      }

      waPayload = {
        ...waPayload,
        type: "template",
        template: templatePayload,
      };

      dbBody = `[TEMPLATE] ${template.name}`;
      templateMeta = {
        id: template.id,
        name: template.name,
        language: template.language,
        category: template.category,
        status: template.status,
        variables: vars,
      };
    } else {
      // MODO TEXTO
      waPayload = {
        ...waPayload,
        type: "text",
        text: { body: messageText },
      };
    }

    // 5) Llamar a la API de WhatsApp
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

    // 6) Insertar mensaje en tabla messages
    const metaPayload: Record<string, unknown> = {
      via: user ? "agent" : "system",
      sent_by: user ? user.id : "system",
      ...(extraMeta || {}),
      whatsapp_response: waJson,
    };

    if (templateMeta) {
      metaPayload.whatsapp_template = templateMeta;
    }

    const { data: newMsg, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conv.id,
        tenant_id: conv.tenant_id,
        channel_id: conv.channel_id,
        direction: "out",
        sender: user ? user.id : "system",
        body: dbBody,
        meta: metaPayload,
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

    // 7) Actualizar conversación
    const nowIso = new Date().toISOString();

    const nextAssignedAgent = user
      ? conv.assigned_agent ?? user.id
      : conv.assigned_agent ?? null;

    await supabase
      .from("conversations")
      .update({
        last_message_at: nowIso,
        status: conv.status === "pending_agent" ? "open" : conv.status,
        assigned_agent: nextAssignedAgent,
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
