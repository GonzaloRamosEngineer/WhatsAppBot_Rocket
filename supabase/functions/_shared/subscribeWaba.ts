// supabase/functions/_shared/subscribeWaba.ts

/**
 * Suscribe un WABA (WhatsApp Business Account) a TU app.
 * Envía la URL del webhook, el token de verificación y
 * LOS CAMPOS (fields) que queremos escuchar.
 */
export async function subscribeWaba(options: {
  accessToken: string;
  wabaId: string;
}) {
  const { accessToken, wabaId } = options;

  if (!accessToken) throw new Error("Missing access token for subscribeWaba");
  if (!wabaId) throw new Error("Missing WABA ID for subscribeWaba");

  const supabaseUrl = Deno.env.get("PROJECT_URL") ?? ""; 
  // OJO: En local a veces PROJECT_URL no está, asegúrate de que esto resuelva bien.
  // Si en tus logs salía bien la URL, entonces PROJECT_URL está bien.
  
  const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
  const verifyToken = Deno.env.get("META_VERIFY_TOKEN") ?? "matchbot_verify_token";

  // Estos son los eventos que necesitamos para que el chat funcione
  const fields = [
    "messages",              // Mensajes de texto, audio, img
    "messaging_postbacks",   // Clics en botones
    "message_deliveries",    // Estado (entregado)
    "message_reads",         // Estado (leído - doble check azul)
    "message_failures"       // Errores de envío
  ];

  const url = `https://graph.facebook.com/v20.0/${wabaId}/subscribed_apps`;

  console.log("[subscribeWaba] subscribing WABA...", { 
    wabaId, 
    webhookUrl,
    fields 
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      override_callback_uri: webhookUrl,
      verify_token: verifyToken,
      // ⚠️ AQUÍ ESTÁ LA MAGIA QUE FALTABA:
      subscribed_fields: fields 
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
    throw new Error(
      `Failed to subscribe WABA ${wabaId}. Status ${res.status}`
    );
  }

  console.log("[subscribeWaba] success", json);
  return json;
}