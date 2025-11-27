// supabase/functions/auto-close-conversations/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Default de minutos si el tenant no configuró nada
const DEFAULT_AUTO_CLOSE_MINUTES = 60;

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
    const now = new Date().toISOString();

    // 1) Traer tenants que tienen autocierre habilitado
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select(
        `
        id,
        name,
        auto_close_enabled,
        auto_close_minutes,
        auto_close_message
      `
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
        }
      );
    }

    if (!tenants || tenants.length === 0) {
      console.log("[auto-close] no tenants with auto_close_enabled = true");
      return new Response(
        JSON.stringify({ message: "No tenants with autoclose enabled" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `[auto-close] tenants with autoclose enabled: ${tenants.length}`
    );

    const results: any[] = [];

    // 2) Para cada tenant, buscar sus conversaciones vencidas
    for (const tenant of tenants) {
      const minutes =
        tenant.auto_close_minutes || DEFAULT_AUTO_CLOSE_MINUTES;

      const thresholdDate = new Date(
        Date.now() - minutes * 60 * 1000
      ).toISOString();

      console.log(
        `[auto-close] tenant ${tenant.id} (${tenant.name}) threshold ${thresholdDate}`
      );

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
          context_data
        `
        )
        .eq("tenant_id", tenant.id)
        .in("status", ["new", "open", "pending"])
        .lt("last_message_at", thresholdDate);

      if (convError) {
        console.error(
          `[auto-close] error fetching conversations for tenant ${tenant.id}`,
          convError
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
          `[auto-close] no conversations to close for tenant ${tenant.id}`
        );
        results.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          closed_count: 0,
        });
        continue;
      }

      console.log(
        `[auto-close] tenant ${tenant.id} has ${conversations.length} conversations to close`
      );

      let closedCount = 0;

      // 3) Autocerrar cada conversación del tenant
      for (const conv of conversations) {
        try {
          const messageText =
            tenant.auto_close_message ||
            buildDefaultClosingMessage(tenant.name);

          // 3.a) Enviar mensaje de cierre usando tu función whatsapp-send-message
          const { error: sendError } = await supabase.functions.invoke(
            "whatsapp-send-message",
            {
              body: {
                conversationId: conv.id,
                text: messageText,
                meta: {
                  reason: "auto_close_timeout",
                  auto_close_minutes: minutes,
                },
              },
            }
          );

          if (sendError) {
            console.error(
              `[auto-close] error sending message for conversation ${conv.id}`,
              sendError
            );
            // no cierro si no pude enviar el mensaje
            continue;
          }

          // 3.b) Actualizar la conversación a closed + contexto
          const existingContext = (conv.context_data as any) || {};
          const updatedContext = {
            ...existingContext,
            auto_closed: true,
            auto_closed_reason: "timeout_inactivity",
            auto_closed_at: now,
            auto_close_minutes: minutes,
          };

          const { error: updateError } = await supabase
            .from("conversations")
            .update({
              status: "closed",
              context_state: "auto_closed",
              context_data: updatedContext,
            })
            .eq("id", conv.id);

          if (updateError) {
            console.error(
              `[auto-close] error updating conversation ${conv.id}`,
              updateError
            );
            continue;
          }

          closedCount += 1;
        } catch (innerErr) {
          console.error(
            `[auto-close] unexpected error for conversation ${conv.id}`,
            innerErr
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
      }
    );
  }
});

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
