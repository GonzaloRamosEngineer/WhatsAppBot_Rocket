// supabase/functions/auto-close-conversations/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Mantengo ambos nombres por compatibilidad con el resto del proyecto
const SUPABASE_URL =
  Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ⏱ Default: 24 horas si el tenant no configuró nada
const DEFAULT_AUTO_CLOSE_MINUTES = 24 * 60; // 1440

// 🔐 Resolver token de Meta a partir del alias (igual que whatsapp-send-message)
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

// 🧩 Mensaje default si el tenant no configuró uno propio
function buildDefaultClosingMessage(tenantName?: string | null): string {
  const name = tenantName?.trim() || "nuestro equipo";
  return (
    "👋 Gracias por tu contacto con " +
    name +
    ". " +
    "Como no recibimos más respuestas en este chat, damos por cerrada la conversación. " +
    "Si necesitás algo más, escribinos de nuevo cuando quieras 🙌"
  );
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

  try {
    const nowIso = new Date().toISOString();

    // 1) Tenants con autocierre habilitado
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select(
        `
        id,
        name,
        auto_close_enabled,
        auto_close_minutes,
        auto_close_message
      `,
      )
      .eq("auto_close_enabled", true);

    if (tenantsError) {
      console.error("[auto-close] error fetching tenants", tenantsError);
      return new Response(
        JSON.stringify({
          error: "Error fetching tenants",
          details: tenantsError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!tenants || tenants.length === 0) {
      console.log("[auto-close] no tenants with auto_close_enabled = true");
      return new Response(
        JSON.stringify({ message: "No tenants with autoclose enabled" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `[auto-close] tenants with autoclose enabled: ${tenants.length}`,
    );

    const results: any[] = [];

    // 2) Procesar tenant por tenant
    for (const tenant of tenants) {
      const minutes =
        tenant.auto_close_minutes || DEFAULT_AUTO_CLOSE_MINUTES;
      const thresholdDate = new Date(
        Date.now() - minutes * 60 * 1000,
      ).toISOString();

      console.log(
        `[auto-close] tenant ${tenant.id} (${tenant.name}) threshold ${thresholdDate}`,
      );

      // 2.a) Buscar conversaciones vencidas de ese tenant (sumo join a channels)
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select(
          `
          id,
          tenant_id,
          channel_id,
          contact_phone,
          status,
          last_message_at,
          context_state,
          context_data,
          channels (
            id,
            phone_id,
            token_alias
          )
        `,
        )
        .eq("tenant_id", tenant.id)
        .in("status", ["new", "open", "pending"])
        .lt("last_message_at", thresholdDate);

      if (convError) {
        console.error(
          `[auto-close] error fetching conversations for tenant ${tenant.id}`,
          convError,
        );
        results.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          error: convError.message,
        });
        continue;
      }

      if (!conversations || conversations.length === 0) {
        console.log(
          `[auto-close] no conversations to close for tenant ${tenant.id}`,
        );
        results.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          closed_count: 0,
        });
        continue;
      }

      console.log(
        `[auto-close] tenant ${tenant.id} has ${conversations.length} conversations to close`,
      );

      let closedCount = 0;

      // 3) Cerrar conversaciones del tenant
      for (const conv of conversations) {
        try {
          const channel = conv.channels;
          if (!channel || !channel.phone_id) {
            console.warn(
              `[auto-close] conversation ${conv.id} has invalid channel`,
            );
            continue;
          }

          const tokenAlias = channel.token_alias ?? "";
          const metaToken = resolveMetaToken(tokenAlias);
          if (!metaToken) {
            console.error(
              `[auto-close] no Meta token configured for alias "${tokenAlias}" (conversation ${conv.id})`,
            );
            continue;
          }

          const messageText =
            tenant.auto_close_message ||
            buildDefaultClosingMessage(tenant.name);

          // 3.a) Enviar mensaje a WhatsApp Cloud directamente
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
            console.error(
              `[auto-close] WhatsApp API error for conversation ${conv.id}:`,
              waRes.status,
              waJson,
            );
            // Si falla el envío, NO cerramos la conversación
            continue;
          }

          // 3.b) Insertar mensaje en tabla messages como "system"
          const { error: msgError } = await supabase
            .from("messages")
            .insert({
              conversation_id: conv.id,
              tenant_id: conv.tenant_id,
              channel_id: conv.channel_id,
              direction: "out",
              sender: "system_auto_close",
              body: messageText,
              meta: {
                via: "auto_close",
                reason: "auto_close_timeout",
                auto_close_minutes: minutes,
                whatsapp_response: waJson,
              },
            });

          if (msgError) {
            console.error(
              `[auto-close] error inserting message for conversation ${conv.id}`,
              msgError,
            );
            // Aun si falla el insert, no cierro para no perder trazabilidad
            continue;
          }

          // 3.c) Actualizar conversación a closed + contexto
          const existingContext = (conv.context_data as any) || {};
          const updatedContext = {
            ...existingContext,
            auto_closed: true,
            auto_closed_reason: "timeout_inactivity",
            auto_closed_at: nowIso,
            auto_close_minutes: minutes,
          };

          const { error: updateError } = await supabase
            .from("conversations")
            .update({
              status: "closed",
              context_state: "auto_closed",
              context_data: updatedContext,
              last_message_at: nowIso, // último mensaje es el de cierre
            })
            .eq("id", conv.id);

          if (updateError) {
            console.error(
              `[auto-close] error updating conversation ${conv.id}`,
              updateError,
            );
            continue;
          }

          closedCount += 1;
        } catch (innerErr) {
          console.error(
            `[auto-close] unexpected error for conversation ${conv.id}`,
            innerErr,
          );
        }
      }

      results.push({
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        closed_count: closedCount,
      });
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[auto-close] unexpected error", e);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
