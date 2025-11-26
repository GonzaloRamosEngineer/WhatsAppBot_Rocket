// C:\Projects\WhatsAppBot_Rocket\supabase\functions\whatsapp-webhook\state-machine-dm.ts
// State machine “estilo DigitalMatch” pero separada del webhook principal.
// En el futuro podés agregar más state machines y elegir según tenant o bot.

const areaMap: Record<string, string> = {
  "1": "1️⃣ Ventas",
  "2": "2️⃣ Marketing",
  "3": "3️⃣ Finanzas",
  "4": "4️⃣ Operaciones",
  "5": "5️⃣ Atención al cliente",
};

const automationTypeMap: Record<string, string> = {
  "1": "🚀 CRM para ventas",
  "2": "📊 Gestión de clientes",
  "3": "📈 Análisis de datos",
};

const predefinedResponses: Record<string, string> = {
  "precio":
    "💰 Los precios dependen del tipo de automatización que necesites.\nMás info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  "soporte":
    "🛠️ Sí, ofrecemos soporte técnico.\nMás info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  "paises":
    "🌎 Trabajamos en EEUU y Latinoamérica.\nMás info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  "países":
    "🌎 Trabajamos en EEUU y Latinoamérica.\nMás info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  "duracion":
    "⏳ El tiempo de implementación depende del proceso a automatizar.\nMás info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  "duración":
    "⏳ El tiempo de implementación depende del proceso a automatizar.\nMás info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  "integraciones":
    "🔗 Nuestras soluciones pueden integrarse con diversas plataformas.\nMás info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  "seguridad":
    "🔒 La seguridad de los datos es nuestra prioridad. Implementamos encriptación y protocolos avanzados.\nMás info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
};

const politeWords = ["ok", "okay", "gracias", "bien", "entendido", "dale"];

// Resolver token de Meta a partir del alias del canal
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

/**
 * State machine para un tenant tipo “DigitalMatch”.
 *
 * Devuelve:
 *   - true  => la state machine respondió algo y ya manejó el mensaje
 *   - false => no respondió nada (dejamos que entren las reglas / default)
 */
export async function runStateMachineForTenant(options: {
  supabase: any;
  tenantId: string;
  channel: any;
  conv: any;
  from: string;
  text: string;
}): Promise<boolean> {
  const { supabase, tenantId, channel, conv, from, text } = options;

  const token = resolveMetaToken(channel.token_alias ?? "");
  if (!token) {
    console.error(
      "StateMachine(DM): no Meta token for channel token_alias:",
      channel.token_alias,
    );
    return false;
  }

  const normalized = text.trim().toLowerCase();
  let state: string | null = conv.context_state ?? null;
  let ctxData: any = conv.context_data ?? {};
  const replies: string[] = [];

  // 1) Preguntas “predefinidas” (precio, soporte, etc.), siempre disponibles
  if (predefinedResponses[normalized]) {
    replies.push(predefinedResponses[normalized]);
  }

  // 2) Comando global: SALIR → reiniciar menú
  if (normalized === "salir") {
    state = "menu_principal";
    ctxData = {};
    replies.push(
      "🔄 Conversación reiniciada.\n\n" +
        "¡Hola! Soy el asistente virtual de DigitalMatchGlobal. 🚀\n\n" +
        "¿Qué tipo de ayuda necesitás? Respondé con el número de la opción:\n\n" +
        "1️⃣ Automatizar procesos\n" +
        "2️⃣ Información sobre servicios\n" +
        "3️⃣ Contactar con un asesor (WhatsApp, correo o videollamada)\n\n" +
        "Escribí 'Salir' para reiniciar en cualquier momento.",
    );
  } else {
    // 3) Si no hay estado aún o el usuario dice “hola” → mostrar menú principal
    if (!state || normalized === "hola") {
      state = "menu_principal";
      replies.push(
        "¡Hola! Soy el asistente virtual de DigitalMatchGlobal. 🚀\n\n" +
          "¿Qué tipo de ayuda necesitás? Respondé con el número de la opción:\n\n" +
          "1️⃣ Automatizar procesos\n" +
          "2️⃣ Información sobre servicios\n" +
          "3️⃣ Contactar con un asesor (WhatsApp, correo o videollamada)\n\n" +
          "Escribí 'Salir' para reiniciar en cualquier momento.",
      );
    } else if (predefinedResponses[normalized]) {
      // ya agregamos reply arriba, no cambiamos estado
    } else if (politeWords.includes(normalized)) {
      replies.push(
        "¡Genial! 😊 Si necesitás más ayuda, decime cómo puedo asistirte.",
      );
    } else {
      // 4) Lógica por estado
      switch (state) {
        case "menu_principal": {
          if (normalized === "1") {
            state = "esperando_area";
            replies.push(
              "¡Genial! ¿En qué área necesitás automatizar?\n\n" +
                "1️⃣ Ventas\n" +
                "2️⃣ Marketing\n" +
                "3️⃣ Finanzas\n" +
                "4️⃣ Operaciones\n" +
                "5️⃣ Atención al cliente\n" +
                "6️⃣ Otros",
            );
          } else if (normalized === "2") {
            state = "info_servicios";
            replies.push(
              "Ofrecemos soluciones de automatización en ventas, marketing, finanzas y atención al cliente.\n" +
                "Podemos ayudarte con bots, integraciones y tableros de datos.\n\n" +
                "Más info: https://digitalmatchglobal.com\n" +
                "Contacto: info@digitalmatchglobal.com\n\n" +
                "Si querés, respondé con 3️⃣ para que un asesor te contacte 😉",
            );
          } else if (normalized === "3") {
            state = "esperando_contacto";
            replies.push(
              "¿Cómo preferís que te contactemos?\n\n" +
                "1️⃣ Agendar una videollamada 📅\n" +
                "2️⃣ Que un asesor te escriba por WhatsApp 📲\n" +
                "3️⃣ Que un asesor te envíe un email 📧",
            );
          } else {
            replies.push(
              "Por favor, seleccioná una opción válida (1, 2 o 3).\n" +
                "Escribí 'Salir' para reiniciar el menú.",
            );
          }
          break;
        }

        case "esperando_contacto": {
          if (normalized === "1") {
            ctxData.medio_contacto = "videollamada";
            replies.push(
              "📅 Podés agendar una consulta directamente acá:\n" +
                "🔗 https://calendly.com/digitalmatch-global/30min\n\n" +
                "¡Espero tu reserva! 😊",
            );
            state = null;
          } else if (normalized === "2") {
            ctxData.medio_contacto = "whatsapp";
            replies.push(
              "Perfecto 🙌 Un asesor se pondrá en contacto con vos por WhatsApp en breve.",
            );
            state = null;
          } else if (normalized === "3") {
            ctxData.medio_contacto = "email";
            replies.push(
              "Perfecto. Por favor, enviame tu email para que podamos contactarte.",
            );
            state = "esperando_email";
          } else {
            replies.push("Por favor, seleccioná una opción válida (1, 2 o 3).");
          }
          break;
        }

        case "esperando_email": {
          if (normalized.includes("@")) {
            ctxData.email = text.trim();
            replies.push(
              "¡Gracias! 🙌 Nos vamos a poner en contacto con vos pronto al correo que nos compartiste.",
            );
            state = null;
          } else {
            replies.push("Por favor, ingresá un email válido.");
          }
          break;
        }

        case "esperando_area": {
          if (["1", "2", "3", "4", "5"].includes(normalized)) {
            ctxData.area = areaMap[normalized] ?? normalized;
            state = "esperando_tipo_automatizacion";
            replies.push(
              "¡Perfecto! Ahora contame qué tipo de automatización necesitás:\n\n" +
                "1️⃣ CRM\n" +
                "2️⃣ Gestión de clientes\n" +
                "3️⃣ Análisis de datos\n" +
                "4️⃣ Otros",
            );
          } else if (normalized === "6") {
            state = "esperando_area_otro";
            replies.push(
              "Genial. Contame en qué área necesitás automatizar (por ejemplo: Recursos Humanos, Proveedores, etc.).",
            );
          } else {
            replies.push(
              "Por favor, seleccioná un número válido entre 1 y 6.",
            );
          }
          break;
        }

        case "esperando_area_otro": {
          ctxData.area_personalizada = text.trim();
          state = "esperando_tipo_automatizacion";
          replies.push(
            "¡Gracias! Ahora decime qué tipo de automatización necesitás:\n\n" +
              "1️⃣ CRM\n" +
              "2️⃣ Gestión de clientes\n" +
              "3️⃣ Análisis de datos\n" +
              "4️⃣ Otros",
          );
          break;
        }

        case "esperando_tipo_automatizacion": {
          if (["1", "2", "3"].includes(normalized)) {
            ctxData.tipo_automatizacion =
              automationTypeMap[normalized] ?? normalized;
            replies.push(
              "¡Excelente! 🙌 Con esa info ya podemos entender mejor tu necesidad.\n" +
                "Un asesor se va a poner en contacto con vos para profundizar y darte una propuesta.",
            );
            state = null;
          } else if (normalized === "4") {
            state = "esperando_tipo_otro";
            replies.push(
              "Perfecto. Contame con tus palabras qué tipo de automatización tenés en mente:",
            );
          } else {
            replies.push(
              "Por favor, seleccioná un número válido entre 1 y 4.",
            );
          }
          break;
        }

        case "esperando_tipo_otro": {
          ctxData.tipo_automatizacion_personalizada = text.trim();
          replies.push(
            "¡Gracias! 🙌 Un asesor se va a poner en contacto con vos para revisar tu caso y proponerte una solución.",
          );
          state = null;
          break;
        }

        case "info_servicios": {
          if (politeWords.includes(normalized)) {
            replies.push(
              "¡Buenísimo! Si querés que te guiemos en algo puntual, escribí 1️⃣ para automatizar procesos o 3️⃣ para que te contacte un asesor.",
            );
          } else if (["1", "3"].includes(normalized)) {
            state = "menu_principal";
          } else {
            replies.push(
              "Si necesitás más info, podés responder con 1️⃣ para automatizar procesos o 3️⃣ para que un asesor te contacte.\n" +
                "O escribí 'Salir' para reiniciar.",
            );
          }
          break;
        }

        default: {
          state = "menu_principal";
          replies.push(
            "Vamos de nuevo 😉\n\n" +
              "¿Qué tipo de ayuda necesitás? Respondé con el número de la opción:\n\n" +
              "1️⃣ Automatizar procesos\n" +
              "2️⃣ Información sobre servicios\n" +
              "3️⃣ Contactar con un asesor (WhatsApp, correo o videollamada)",
          );
          break;
        }
      }
    }
  }

  const stateChanged = state !== conv.context_state;
  const hasReplies = replies.length > 0;

  if (!stateChanged && !hasReplies) {
    return false;
  }

  // Actualizar contexto en conversations
  try {
    await supabase
      .from("conversations")
      .update({
        context_state: state,
        context_data:
          ctxData && Object.keys(ctxData).length > 0 ? ctxData : null,
      })
      .eq("id", conv.id);
  } catch (e) {
    console.error("StateMachine(DM): error updating conversation:", e);
  }

  // Enviar respuestas
  for (const reply of replies) {
    try {
      await sendWhatsAppText({
        channel,
        token,
        to: from,
        text: reply,
      });

      await supabase.from("messages").insert({
        conversation_id: conv.id,
        tenant_id: tenantId,
        channel_id: conv.channel_id,
        direction: "out",
        sender: "bot",
        body: reply,
        meta: {
          via: "state_machine_dm_v1",
          context_state: state,
          context_data: ctxData,
        },
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("StateMachine(DM): error sending message:", e);
    }
  }

  return hasReplies;
}
