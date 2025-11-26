// C:\Projects\WhatsAppBot_Rocket\supabase\functions\whatsapp-webhook\index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runStateMachineForTenant } from "./state-machine-dm.ts";

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
// Helpers generales
// ----------------------------------------------
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

async function sendWhatsAppText(options: {
  channel: any;
  token: string;
  to: string;
  text: string;
}) {
  const { channel, token, to, text } = options;
  if (!text) return;

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
        to,
        text: { body: text },
      }),
    },
  );
}

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
  rules = rules.filter((r) => r.isActive !== false);

  if (rules.length === 0) return null;

  const welcomeRules = rules.filter((r) => r.triggerType === "welcome");
  const keywordRules = rules.filter((r) => r.triggerType === "keyword");
  const fallbackRules = rules.filter((r) => r.triggerType === "fallback");

  let selected: UiFlowRule | null = null;

  if (isNewConversation && welcomeRules.length > 0) {
    selected = welcomeRules[0];
  } else {
    for (const rule of keywordRules) {
      const kws = rule.keywords || [];
      if (kws.some((kw) => normalized.includes(kw.toLowerCase()))) {
        selected = rule;
        break;
      }
    }

    if (!selected && fallbackRules.length > 0) {
      selected = fallbackRules[0];
    }
  }

  if (!selected) return null;

  const token = resolveMetaToken(channel.token_alias ?? "");
  if (!token) {
    console.error("No Meta token for channel token_alias:", channel.token_alias);
    return null;
  }

  for (const resp of selected.responses || []) {
    const replyText = resp.message;
    if (!replyText) continue;

    try {
      await sendWhatsAppText({
        channel,
        token,
        to: from,
        text: replyText,
      });

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

// ----------------------------------------------
// Handler HTTP principal
// ----------------------------------------------
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

  if (!channel) {
    return new Response("ok", { status: 200 });
  }

  const msgs = value?.messages ?? [];
  for (const m of msgs) {
    const from = m.from;
    const text = m.text?.body ?? "";
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
    let conversation: any = existingConv ?? null;

    if (!convId) {
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
      conversation = newConv ?? null;
      isNewConversation = true;
    } else {
      const nextStatus =
        existingConv.status === "closed" ? "open" : existingConv.status;

      await supabase
        .from("conversations")
        .update({
          status: nextStatus,
          last_message_at: nowIso,
        })
        .eq("id", existingConv.id);

      conversation = {
        ...existingConv,
        status: nextStatus,
        last_message_at: nowIso,
      };
    }

    // Guardar mensaje entrante
    if (convId) {
      await supabase.from("messages").insert({
        conversation_id: convId,
        tenant_id: channel.tenant_id,
        channel_id: channel.id,
        direction: "in",
        sender: from,
        body: text,
        meta: m,
        created_at: nowIso,
      });
    }

    // --- Resolver bot del tenant ---
    const { data: bot } = await supabase
      .from("bots")
      .select("id, tenant_id, name")
      .eq("tenant_id", channel.tenant_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bot?.id && convId && conversation) {
      // 1) Intentar primero la state machine (tenant-aware)
      const handledByStateMachine = await runStateMachineForTenant({
        supabase,
        tenantId: channel.tenant_id,
        channel,
        conv: conversation,
        from,
        text,
      });

      if (!handledByStateMachine) {
        // 2) Intentar motor de reglas configurables (rules_v1)
        const usedRule = await runRulesEngine({
          supabase,
          tenantId: channel.tenant_id,
          botId: bot.id,
          channel,
          from,
          text,
          convId,
          isNewConversation,
        });

        if (!usedRule) {
          // 3) Fallback a flow "default"
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

          const token = resolveMetaToken(channel.token_alias ?? "");
          if (token && reply) {
            try {
              await sendWhatsAppText({
                channel,
                token,
                to: from,
                text: reply,
              });
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
  }

  return new Response("ok", { status: 200 });
});
