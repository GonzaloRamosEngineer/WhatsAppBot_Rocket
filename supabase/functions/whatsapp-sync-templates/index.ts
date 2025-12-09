// C:\Projects\WhatsAppBot_Rocket\supabase\functions\whatsapp-sync-templates\index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 🔐 Igual que en whatsapp-send-message
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

// 🔐 Helper unificado: intenta env por alias, luego DB meta_tokens
async function getMetaAccessToken(opts: {
  supabase: any;
  tenantId: string;
  tokenAlias?: string | null;
}): Promise<string | null> {
  const { supabase, tenantId } = opts;
  const alias = (opts.tokenAlias || "default").trim();

  // 1) Intentar por env (alias → META_TOKEN_DM / FEA / META_TOKEN__ALGO)
  const envToken = resolveMetaToken(alias);
  if (envToken) return envToken;

  // 2) Buscar en meta_tokens por tenant + provider + alias
  const { data, error } = await supabase
    .from("meta_tokens")
    .select("access_token")
    .eq("tenant_id", tenantId)
    .eq("provider", "facebook")
    .eq("alias", alias)
    .maybeSingle();

  if (error) {
    console.error(
      "[whatsapp-sync-templates] getMetaAccessToken meta_tokens error:",
      error,
      { tenantId, alias },
    );
    return null;
  }

  return data?.access_token ?? null;
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
  const hasUserAuth = !!authHeader;

  // Supabase con service role (para escribir en DB)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: {
      headers: hasUserAuth ? { Authorization: authHeader } : {},
    },
  });

  // Body esperado
  let body: {
    channelId?: string;
    dryRun?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body", ok: false }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { channelId, dryRun = false } = body || {};

  if (!channelId) {
    return new Response(
      JSON.stringify({ error: "channelId is required", ok: false }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Usuario (si viene desde frontend)
  let user: { id: string } | null = null;
  if (hasUserAuth) {
    const {
      data: { user: supaUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !supaUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", ok: false }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    user = { id: supaUser.id };
  }

  try {
    // 1) Obtener canal + tenant
    const { data: channel, error: chError } = await supabase
      .from("channels")
      .select("id, tenant_id, meta_waba_id, token_alias")
      .eq("id", channelId)
      .maybeSingle();

    if (chError) {
      console.error("[whatsapp-sync-templates] error loading channel:", chError);
      return new Response(
        JSON.stringify({
          error: "Failed to load channel",
          ok: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!channel) {
      return new Response(
        JSON.stringify({ error: "Channel not found", ok: false }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2) Verificar membership (solo si viene de usuario real)
    if (user) {
      const { data: membership, error: memberError } = await supabase
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("tenant_id", channel.tenant_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError) {
        console.error(
          "[whatsapp-sync-templates] error checking membership:",
          memberError,
        );
        return new Response(
          JSON.stringify({
            error: "Failed to check membership",
            ok: false,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (!membership) {
        return new Response(
          JSON.stringify({
            error: "Forbidden for this tenant",
            ok: false,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    if (!channel.meta_waba_id) {
      return new Response(
        JSON.stringify({
          error: "Channel has no meta_waba_id configured",
          ok: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const metaToken = await getMetaAccessToken({
      supabase,
      tenantId: channel.tenant_id,
      tokenAlias: channel.token_alias ?? null,
    });

    if (!metaToken) {
      return new Response(
        JSON.stringify({
          error: "Meta token not configured for this channel (alias + tenant)",
          ok: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 3) Llamar a Meta: listar templates del WABA
    const wabaId = channel.meta_waba_id;

    let after: string | null = null;
    const allTemplates: any[] = [];
    let pageCount = 0;

    do {
      const params = new URLSearchParams({
        limit: "100",
      });
      if (after) params.set("after", after);

      const url = `https://graph.facebook.com/v20.0/${wabaId}/message_templates?${params.toString()}`;

      const waRes = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${metaToken}`,
        },
      });

      const waJson = await waRes.json();

      if (!waRes.ok) {
        console.error(
          "[whatsapp-sync-templates] WhatsApp API error:",
          waRes.status,
          waJson,
        );
        return new Response(
          JSON.stringify({
            error: "WhatsApp API error",
            details: waJson,
            ok: false,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const data = Array.isArray(waJson.data) ? waJson.data : [];
      allTemplates.push(...data);
      pageCount++;

      after = waJson.paging?.cursors?.after ?? null;
    } while (after && pageCount < 10); // safety limit

    // 4) Mapear a nuestro modelo
    let skippedNoCategory = 0;
    let skippedInvalidCategory = 0;
    let skippedNoBody = 0;

    // Categorías oficiales Meta que aceptamos (ya están en template_categories)
    const validCategories = new Set([
      "AUTHENTICATION",
      "MARKETING",
      "SERVICE",
      "UTILITY",
    ]);

    const upsertRows: any[] = [];

    for (const tpl of allTemplates) {
      const metaName = tpl.name as string | undefined;
      const metaLang = tpl.language as string | undefined;
      const metaCategory = tpl.category as string | undefined;
      const metaStatusRaw = (tpl.status as string | undefined) ?? null;
      const metaComponents = Array.isArray(tpl.components)
        ? tpl.components
        : null;

      if (!metaCategory) {
        skippedNoCategory++;
        continue;
      }

      if (!validCategories.has(metaCategory)) {
        skippedInvalidCategory++;
        continue;
      }

      // Extraer body (componente BODY.text)
      let bodyText = "";
      if (metaComponents) {
        const bodyComp = metaComponents.find(
          (c: any) => c.type === "BODY" && typeof c.text === "string",
        );
        if (bodyComp && typeof bodyComp.text === "string") {
          bodyText = bodyComp.text;
        }
      }

      if (!bodyText) {
        skippedNoBody++;
        continue;
      }

      // Normalizar status a nuestro enum
      let normalizedStatus: string | null = null;
      if (metaStatusRaw) {
        const up = metaStatusRaw.toUpperCase();
        if (up === "APPROVED") normalizedStatus = "APPROVED";
        else if (up === "PENDING") normalizedStatus = "PENDING";
        else if (up === "REJECTED") normalizedStatus = "REJECTED";
        else normalizedStatus = "DISABLED";
      }

      // Quality (si viene)
      let quality: string | null = null;
      if (tpl.quality_score) {
        quality =
          tpl.quality_score.score ||
          tpl.quality_score.current_score ||
          null;
      }

      // Motivo rechazo (si viene)
      const rejectionReason =
        tpl.rejected_reason || tpl.rejection_reason || null;

      upsertRows.push({
        tenant_id: channel.tenant_id,
        channel_id: channel.id,
        name: metaName ?? "template_sin_nombre",
        language: metaLang ?? "es",
        category: metaCategory,
        status: normalizedStatus,
        body: bodyText,
        definition: tpl, // JSON completo devuelto por Meta
        components: metaComponents,
        external_id: tpl.id ?? null,
        last_synced_at: new Date().toISOString(),
        quality,
        meta_rejection_reason: rejectionReason,
      });
    }

    if (!dryRun && upsertRows.length > 0) {
      const { error: upsertError } = await supabase
        .from("templates")
        .upsert(upsertRows, {
          onConflict: "tenant_id,name,language",
        });

      if (upsertError) {
        console.error(
          "[whatsapp-sync-templates] error upserting templates:",
          upsertError,
        );
        return new Response(
          JSON.stringify({
            error: "Failed to upsert templates",
            details: upsertError.message,
            ok: false,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const response = {
      ok: true,
      dryRun,
      found: allTemplates.length,
      synced: dryRun ? 0 : upsertRows.length,
      skipped: {
        noCategory: skippedNoCategory,
        invalidCategory: skippedInvalidCategory,
        noBody: skippedNoBody,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[whatsapp-sync-templates] Unexpected error:", e);
    return new Response(
      JSON.stringify({
        error: "Unexpected error",
        details: String(e),
        ok: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
