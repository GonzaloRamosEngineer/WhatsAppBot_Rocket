// C:\Projects\WhatsAppBot_Rocket\supabase\functions\whatsapp-discover\index.ts

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
    //
    // 1) Obtener los negocios (Business Manager) del usuario
    //
    const meRes = await fetch(
      `https://graph.facebook.com/v20.0/me?` +
        `fields=id,name,businesses{id,name}&access_token=${
          encodeURIComponent(accessToken)
        }`,
    );

    if (!meRes.ok) {
      const err = await meRes.text();
      console.error("Error fetching /me businesses:", err);
      return new Response(
        JSON.stringify({ error: "Failed to list businesses", details: err }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const meJson = await meRes.json();
    const businesses = (meJson.businesses?.data ?? []) as Array<
      { id: string; name?: string }
    >;

    if (!businesses.length) {
      // Usuario sin negocios asociados / nada que mostrar
      return new Response(
        JSON.stringify({
          wabas: [],
          note:
            "No se encontraron negocios asociados al usuario en Meta. " +
            "Verificá que el usuario sea admin de la cuenta de negocio donde está la WABA.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const enriched: any[] = [];

    //
    // 2) Para cada negocio, traer sus WABA (owned_whatsapp_business_accounts)
    //
    for (const biz of businesses) {
      const bizId = biz.id;

      const wabaRes = await fetch(
        `https://graph.facebook.com/v20.0/${bizId}?` +
          `fields=owned_whatsapp_business_accounts{id,name}&access_token=${
            encodeURIComponent(accessToken)
          }`,
      );

      if (!wabaRes.ok) {
        const errTxt = await wabaRes.text();
        console.error(
          "Error fetching owned_whatsapp_business_accounts for business",
          bizId,
          errTxt,
        );
        enriched.push({
          business_id: bizId,
          business_name: biz.name ?? null,
          wabas: [],
          error: "failed_to_fetch_wabas",
          error_details: errTxt,
        });
        continue;
      }

      const wabaJson = await wabaRes.json();
      const wabas = (wabaJson.owned_whatsapp_business_accounts?.data ??
        []) as Array<{ id: string; name?: string }>;

      //
      // 3) Para cada WABA, traer phone_numbers
      //
      for (const w of wabas) {
        const wabaId = w.id;

        const phonesRes = await fetch(
          `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?` +
            `fields=id,display_phone_number,verified_name,quality_rating,` +
            `platform_type,code_verification_status&access_token=${
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
            business_id: bizId,
            business_name: biz.name ?? null,
            waba_id: wabaId,
            waba_name: w.name ?? null,
            phone_numbers: [],
            error: "failed_to_fetch_phone_numbers",
            error_details: errTxt,
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
          business_id: bizId,
          business_name: biz.name ?? null,
          waba_id: wabaId,
          waba_name: w.name ?? null,
          phone_numbers: phoneNumbers,
        });
      }
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
