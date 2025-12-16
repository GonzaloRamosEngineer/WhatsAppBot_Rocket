// supabase/functions/_shared/subscribeWaba.ts

/**
 * Suscribe un WABA (WhatsApp Business Account) a TU app,
 * enviando explícitamente la URL del webhook y el verify token.
 */
export async function subscribeWaba(options: {
  accessToken: string;
  wabaId: string;
}) {
  const { accessToken, wabaId } = options;

  if (!accessToken) throw new Error("Missing access token for subscribeWaba");
  if (!wabaId) throw new Error("Missing WABA ID for subscribeWaba");

  // 1. Construimos la URL de tu Webhook dinámicamente
  // SUPABASE_URL suele ser "https://<project_ref>.supabase.co"
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""; 
  // Ojo: Asegúrate de que apunte a tu webhook. 
  // Si SUPABASE_URL no te funciona, puedes usar una variable de entorno propia como "WEBHOOK_BASE_URL"
  
  // La ruta estándar de Supabase Edge Functions:
  const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
  
  const verifyToken = Deno.env.get("META_VERIFY_TOKEN") ?? "matchbot_verify_token";

  const url = `https://graph.facebook.com/v20.0/${wabaId}/subscribed_apps`;

  console.log("[subscribeWaba] subscribing WABA...", { 
    wabaId, 
    webhookUrl 
  });

  // 2. Enviamos el Webhook URL y el Token en el body
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      override_callback_uri: webhookUrl,
      verify_token: verifyToken,
    }),
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    console.error("[subscribeWaba] error response", {
      status: res.status,
      body: json,
    });
    // Si falla porque el usuario no es admin del negocio, esto lanzará error
    throw new Error(
      `Failed to subscribe WABA ${wabaId}. Status ${res.status} - ${JSON.stringify(json)}`
    );
  }

  console.log("[subscribeWaba] success", json);
  return json;
}