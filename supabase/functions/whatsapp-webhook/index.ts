// C:\Projects\WhatsAppBot_Rocket\supabase\functions\whatsapp-webhook\index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runStateMachineForTenant } from "./state-machine-dm.ts";
import { resolveMetaToken } from "../_shared/metaToken.ts";

const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY")!;
const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN")!;

// ----------------------------------------------
// Tipos para las reglas definidas en Flow Builder
// ----------------------------------------------
type UiFlowRule = {
  id: string | number;
  name: string;
  description?: string;
  triggerType: "keyword" | "welcome" | "fallback";
  keywords?: string[];
  responses: { message: string; delay: number }[];
  isActive?: boolean;
};

type RulesDefinitionV1 = {
  version: number;
  engine: string;
  rules: UiFlowRule[];
};

// ----------------------------------------------
// Motor de reglas v1 (flows.key = 'rules_v1')
// ----------------------------------------------
async function runRulesEngine(options: {
  supabase: any;
  tenantId: string;
  botId: string;
  channel: any;
  from: string;
  text: string;
  convId: string;
  isNewConversation: boolean;
}) {
  const {
    supabase,
    tenantId,
    botId,
    channel,
    from,
    text,
    convId,
    isNewConversation,
  } = options;

  const normalized = text.trim().toLowerCase();

  // 1) obtener flow rules_v1 del bot
  const { data: flowRow, error: flowError } = await supabase
    .from("flows")
    .select("definition")
    .eq("bot_id", botId)
    .eq("key", "rules_v1")
    .maybeSingle();

  if (flowError || !flowRow?.definition) {
    if (flowError) {
      console.error("rules_v1 flow error:", flowError);
    }
    return null;
  }

  const def = flowRow.definition as RulesDefinitionV1;
  let rules = def.rules || [];
  // Solo reglas activas
  rules = rules.filter((r) => r.isActive !== false);

  if (rules.length === 0) return null;

  const welcomeRules = rules.filter((r) => r.triggerType === "welcome");
  const keywordRules = rules.filter((r) => r.triggerType === "keyword");
  const fallbackRules = rules.filter((r) => r.triggerType === "fallback");

  let selected: UiFlowRule | null = null;

  // 2) Si es conversación nueva y hay welcome
  if (isNewConversation && welcomeRules.length > 0) {
    selected = welcomeRules[0];
  } else {
    // 3) Intentar keyword
    for (const rule of keywordRules) {
      const kws = rule.keywords || [];
      if (kws.some((kw) => normalized.includes(kw.toLowerCase()))) {
        selected = rule;
        break;
      }
    }

    // 4) Fallback si no matchea nada
    if (!selected && fallbackRules.length > 0) {
      selected = fallbackRules[0];
    }
  }

  if (!selected) return null;

  const token = await resolveMetaToken(
    supabase,
    tenantId,
    channel.token_alias ?? "default",
  );
  if (!token) {
    console.error(
      "[whatsapp-webhook][rules_v1] No Meta token for channel token_alias:",
      channel.token_alias,
    );
    return null;
  }

  // 5) Enviar respuestas al usuario
  for (const resp of selected.responses || []) {
    const replyText = resp.message;
    if (!replyText) continue;

    try {
      await fetch(
        `https://graph.facebook.com/v20.0/${channel.phone_id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: from,
            text: { body: replyText },
          }),
        },
      );

      await supabase.from("messages").insert({
        conversation_id: convId,
        tenant_id: tenantId,
        channel_id: channel.id,
        direction: "out",
        sender: "bot",
        body: replyText,
        meta: { via: "auto-flow-rules", rule_id: selected.id },
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Error sending WhatsApp message (rules_v1):", e);
    }
  }

  return selected;
}

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const url = new URL(req.url);

  // --- GET: verificación de webhook (hub.challenge) ---
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // --- POST: eventos de WhatsApp ---
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const change = body?.entry?.[0]?.changes?.[0];
  const value = change?.value;
  const phoneId = value?.metadata?.phone_number_id as string | undefined;

  // Buscar canal por phone_id
  let channel: any = null;
  if (phoneId) {
    const { data: ch } = await supabase
      .from("channels")
      .select("*")
      .eq("phone_id", phoneId)
      .maybeSingle();
    channel = ch ?? null;
  }

  // Guardar SIEMPRE el evento crudo
  await supabase.from("webhook_events").insert({
    tenant_id: channel?.tenant_id ?? null,
    channel_id: channel?.id ?? null,
    provider: "whatsapp_cloud",
    event_type: "webhook",
    payload: body,
  });

  // Si no reconocemos el canal, respondemos igual OK para que Meta no reintente
  if (!channel) {
    return new Response("ok", { status: 200 });
  }

  // Procesar mensajes entrantes
  const msgs = value?.messages ?? [];
  for (const m of msgs) {
    const from = m.from;
    
    // --- [PARCHE CRÍTICO INICIO] Extracción Inteligente de Texto ---
    // Extraemos el contenido real visible independientemente del tipo (texto, botón, lista)
    let text = "";
    
    if (m.type === "text") {
      text = m.text?.body ?? "";
    } else if (m.type === "button") {
      // Botones legacy (Reply Buttons en templates viejos)
      text = m.button?.text ?? "[Botón]";
    } else if (m.type === "interactive") {
      // Interacciones Modernas (Quick Replies, Lists, etc.)
      const interaction = m.interactive;
      if (interaction?.type === "button_reply") {
        text = interaction.button_reply?.title ?? "[Opción]";
      } else if (interaction?.type === "list_reply") {
        text = interaction.list_reply?.title ?? "[Lista]";
      } else {
        text = "[Interacción]"; // Fallback para tipos desconocidos
      }
    } else {
      // Multimedia y otros (Imagen, Audio, Sticker, Location, etc.)
      // Guardamos el tipo entre corchetes para que se vea algo en el log
      text = `[${m.type.toUpperCase()}]`; 
      // Opcional: Si es imagen y tiene caption, podrías concatenarlo:
      // if (m.image?.caption) text += " " + m.image.caption;
    }
    // --- [PARCHE CRÍTICO FIN] ---

    if (!from) continue;

    const nowIso = new Date().toISOString();

    // --- Asegurar conversación (1 por contacto y canal) ---
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("*")
      .eq("tenant_id", channel.tenant_id)
      .eq("channel_id", channel.id)
      .eq("contact_phone", from)
      .maybeSingle();

    let convId = existingConv?.id;
    let isNewConversation = false;

    if (!convId) {
      // Nueva conversación
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          tenant_id: channel.tenant_id,
          channel_id: channel.id,
          contact_phone: from,
          status: "new",
          last_message_at: nowIso,
        })
        .select()
        .single();
      convId = newConv?.id ?? null;
      isNewConversation = true;
    } else {
      // Actualizar existente
      const nextStatus =
        existingConv.status === "closed" ? "open" : existingConv.status;

      await supabase
        .from("conversations")
        .update({
          status: nextStatus,
          last_message_at: nowIso,
        })
        .eq("id", existingConv.id);
    }

    if (!convId) {
      continue;
    }

    // Recargar la conversación
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", convId)
      .maybeSingle();

    if (!conversation) {
      continue;
    }

    // Guardar mensaje entrante (Con el 'text' corregido)
    await supabase.from("messages").insert({
      conversation_id: convId,
      tenant_id: channel.tenant_id,
      channel_id: channel.id,
      direction: "in",
      sender: from,
      body: text, // Ahora contiene el título del botón o el texto normal
      meta: m,    // Guardamos el JSON crudo original aquí por si acaso
      created_at: nowIso,
    });

    // --- Resolver bot del tenant ---
    const { data: bot } = await supabase
      .from("bots")
      .select("id, tenant_id, name")
      .eq("tenant_id", channel.tenant_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bot?.id && convId) {
      // 1) State Machine
      const handledByStateMachine = await runStateMachineForTenant({
        supabase,
        tenantId: channel.tenant_id,
        channel,
        conv: conversation,
        from,
        text, // Pasamos el texto extraído correctamente al bot
        isNewConversation,
      });

      if (handledByStateMachine) {
        continue;
      }

      // 2) Rules Engine
      const usedRule = await runRulesEngine({
        supabase,
        tenantId: channel.tenant_id,
        botId: bot.id,
        channel,
        from,
        text, // Pasamos el texto extraído correctamente al bot
        convId,
        isNewConversation,
      });

      // ✅ 3) Fallback Default (DESCOMENTADO)
      if (!usedRule) {
        // Si no hay reglas, intentamos usar el flujo 'default' o un mensaje básico
        let reply = `👋 Hola! Recibimos tu mensaje: "${text}"`; 

        const { data: flow } = await supabase
          .from("flows")
          .select("definition")
          .eq("bot_id", bot.id)
          .eq("key", "default")
          .maybeSingle();

        const salute = (flow as any)?.definition?.nodes?.find?.(
          (n: any) => n.id === "saludo",
        );
        if (salute?.text) reply = salute.text;

        const token = await resolveMetaToken(
          supabase,
          channel.tenant_id,
          channel.token_alias ?? "default",
        );

        if (token && reply) {
          try {
            await fetch(
              `https://graph.facebook.com/v20.0/${channel.phone_id}/messages`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  to: from,
                  text: { body: reply },
                }),
              },
            );
          } catch (e) {
            console.error("Error sending WhatsApp message (default):", e);
          }

          await supabase.from("messages").insert({
            conversation_id: convId,
            tenant_id: channel.tenant_id,
            channel_id: channel.id,
            direction: "out",
            sender: "bot",
            body: reply,
            meta: { via: "auto-reply-default" },
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  }

  return new Response("ok", { status: 200 });
});