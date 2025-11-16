// supabase/functions/whatsapp-discover/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

  let body: { facebookAccessToken?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const accessToken = body.facebookAccessToken;
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: "facebookAccessToken is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // 1) Obtener WABAs del usuario
    const meRes = await fetch(
      `https://graph.facebook.com/v20.0/me?fields=whatsapp_business_accounts{id,name}&access_token=${
        encodeURIComponent(accessToken)
      }`,
    );

    if (!meRes.ok) {
      const err = await meRes.text();
      return new Response(
        JSON.stringify({ error: "Failed to list WABAs", details: err }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const meJson = await meRes.json();
    const wabas = (meJson.whatsapp_business_accounts?.data ?? []) as Array<
      { id: string; name?: string }
    >;

    const enriched: any[] = [];

    // 2) Para cada WABA, traer phone_numbers
    for (const w of wabas) {
      const wabaId = w.id;
      const phonesRes = await fetch(
        `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?access_token=${
          encodeURIComponent(accessToken)
        }`,
      );

      if (!phonesRes.ok) {
        const errTxt = await phonesRes.text();
        console.error(
          "Error fetching phone_numbers for WABA",
          wabaId,
          errTxt,
        );
        enriched.push({
          id: wabaId,
          name: w.name ?? null,
          phone_numbers: [],
          error: "failed_to_fetch_phone_numbers",
        });
        continue;
      }

      const phonesJson = await phonesRes.json();
      const phoneNumbers = (phonesJson.data ?? []).map((p: any) => ({
        id: p.id,
        display_phone_number: p.display_phone_number,
        verified_name: p.verified_name ?? null,
        quality_rating: p.quality_rating ?? null,
        platform_type: p.platform_type ?? null,
        status: p.code_verification_status ?? null,
      }));

      enriched.push({
        id: wabaId,
        name: w.name ?? null,
        phone_numbers: phoneNumbers,
      });
    }

    return new Response(JSON.stringify({ wabas: enriched }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unexpected error whatsapp-discover:", e);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
