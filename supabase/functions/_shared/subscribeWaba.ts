// supabase/functions/_shared/subscribeWaba.ts

/**
 * Suscribe un WABA (WhatsApp Business Account) a TU app,
 * para que empiece a enviar webhooks a la URL configurada
 * en el panel de developers.
 *
 * IMPORTANTE:
 *  - accessToken: debe ser el token del tenant (usuario) que conectó el WABA,
 *    con permisos whatsapp_business_management / business_management.
 *  - wabaId: el ID de la cuenta de WhatsApp Business (meta_waba_id en tu tabla channels).
 */
export async function subscribeWaba(options: {
  accessToken: string;
  wabaId: string;
}) {
  const { accessToken, wabaId } = options;

  if (!accessToken) {
    console.error("[subscribeWaba] missing accessToken");
    throw new Error("Missing access token for subscribeWaba");
  }

  if (!wabaId) {
    console.error("[subscribeWaba] missing wabaId");
    throw new Error("Missing WABA ID for subscribeWaba");
  }

  const url = `https://graph.facebook.com/v20.0/${wabaId}/subscribed_apps`;

  console.log("[subscribeWaba] subscribing WABA", { wabaId, url });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // si no hay body, lo dejamos en null
    json = null;
  }

  if (!res.ok) {
    console.error("[subscribeWaba] error response", {
      status: res.status,
      body: json,
    });
    throw new Error(
      `Failed to subscribe WABA ${wabaId}. Status ${res.status}`,
    );
  }

  console.log("[subscribeWaba] success", json);
  return json;
}
