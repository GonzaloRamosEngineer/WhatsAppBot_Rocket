// C:\Projects\WhatsAppBot_Rocket\supabase\functions\whatsapp-webhook\state-machine-dm.ts

type ConversationRow = {
  id: string;
  tenant_id: string;
  channel_id: string;
  contact_phone: string;
  status: string;
  last_message_at: string | null;
  context_state?: string | null;
  context_data?: any | null;
};

type ChannelRow = {
  id: string;
  tenant_id: string;
  type: string;
  phone: string;
  phone_id: string;
  token_alias?: string | null;
};

type StateMachineOptions = {
  supabase: any;
  tenantId: string;
  channel: ChannelRow;
  conv: ConversationRow;
  from: string;
  text: string;
  isNewConversation: boolean;
};

// Palabras “amables” tipo gracias / ok
const politeWords = [
  "gracias",
  "ok",
  "okay",
  "bien",
  "entendido",
  "dale",
  "genial",
  "joya",
  "perfecto",
];

// Comando global de menú
const menuWords = ["menu", "menú"];

// Palabras que disparan flujo de presupuesto
const budgetWords = [
  "presupuesto",
  "presupuestos",
  "cotizacion",
  "cotización",
  "quote",
];

// Mapas de contexto (similar a tu constants.js viejo)
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
  precio:
    "💰 Los precios dependen del tipo de automatización que necesites. Más info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  soporte:
    "🛠️ Sí, ofrecemos soporte técnico. Más info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  "países":
    "🌎 Trabajamos en EEUU y Latinoamérica. Más info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  paises:
    "🌎 Trabajamos en EEUU y Latinoamérica. Más info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  duración:
    "⏳ El tiempo de implementación depende del proceso a automatizar. Más info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  duracion:
    "⏳ El tiempo de implementación depende del proceso a automatizar. Más info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  integraciones:
    "🔗 Nuestras soluciones pueden integrarse con diversas plataformas. Más info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
  seguridad:
    "🔒 La seguridad de los datos es nuestra prioridad. Implementamos buenas prácticas y protocolos avanzados. Más info: https://digitalmatchglobal.com\nContacto: info@digitalmatchglobal.com",
};

// Resolver token real de Meta a partir del alias guardado en channels.token_alias
function resolveMetaToken(alias: string | null | undefined): string | null {
  if (!alias) return null;

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

// 🔧 Leer lista de tenants (opcional) desde env DM_TENANT_IDS
// Formato: DM_TENANT_IDS="uuid1,uuid2,uuid3"
function getDmTenantIds(): string[] {
  const raw = Deno.env.get("DM_TENANT_IDS") ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// 🎛 MENSAJE DE MENÚ PRINCIPAL
function buildMainMenuMessage() {
  return (
    "¡Hola! Soy el asistente virtual de DigitalMatchGlobal. 🚀\n\n" +
    "¿Qué tipo de ayuda necesitás? Respondé con el número de la opción:\n\n" +
    "1️⃣ Automatizar procesos\n" +
    "2️⃣ Información sobre servicios\n" +
    "3️⃣ Contactar con un asesor (WhatsApp, correo o videollamada)\n\n" +
    "Escribí 'Salir' para reiniciar en cualquier momento."
  );
}

// 🧠 IMPLEMENTACIÓN REAL DE LA STATE MACHINE (no mira tenants)
async function runDmStateMachine(
  options: StateMachineOptions,
): Promise<boolean> {
  const { supabase, tenantId, channel, conv, from, text, isNewConversation } =
    options;

  const normalized = text.trim().toLowerCase();

  let state: string | null = conv.context_state ?? null;
  let ctxData: any = conv.context_data ?? {};
  const replies: string[] = [];

  // 0) Comando global: PRESUPUESTO → flujo propio
  if (budgetWords.includes(normalized)) {
    state = "esperando_presupuesto";
    ctxData = {
      ...ctxData,
      budget_init_text: text.trim(),
    };
    replies.push(
      "Perfecto 💸 Contame brevemente qué querés automatizar, en qué área y si hoy usás algún sistema. Con eso armamos un primer estimado para vos.",
    );
  }
  // 1) Preguntas “predefinidas” (precio, soporte, etc.), siempre disponibles
  else if (predefinedResponses[normalized]) {
    replies.push(predefinedResponses[normalized]);
  }
  // 2) Comando global: SALIR → reiniciar menú
  else if (normalized === "salir") {
    state = "menu_principal";
    ctxData = {};
    replies.push("🔄 Conversación reiniciada.\n\n" + buildMainMenuMessage());
  }
  // 3) Comando global: MENU → ir directo al menú
  else if (menuWords.includes(normalized)) {
    state = "menu_principal";
    ctxData = {
      ...ctxData,
      last_command: "menu",
    };
    replies.push(buildMainMenuMessage());
  }
  // 4) Palabras “amables”: gracias, ok, etc.
  else if (politeWords.includes(normalized)) {
    replies.push(
      "¡Genial! 😊 Si necesitás más ayuda, decime cómo puedo asistirte.",
    );
  }
  // 5) Conversación nueva o user dice "hola" → menú principal
  else if (!state && (isNewConversation || normalized === "hola")) {
    state = "menu_principal";
    replies.push(buildMainMenuMessage());
  }
  // 6) No hay estado, no es conversación nueva, y no dijo hola
  else if (!state && !isNewConversation) {
    replies.push(
      "No entendí tu mensaje en este contexto 🤔\n" +
        "Si querés volver al menú principal, escribí *Hola*.",
    );
  } else {
    // 7) Tenemos algún estado vigente → procesar flujo
    switch (state) {
      case "menu_principal": {
        if (normalized === "1") {
          state = "esperando_area";
          ctxData.menu_opcion = "automatizar_procesos";

          replies.push(
            "¡Genial! ¿En qué área necesitás automatizar?\n" +
              "1️⃣ Ventas\n" +
              "2️⃣ Marketing\n" +
              "3️⃣ Finanzas\n" +
              "4️⃣ Operaciones\n" +
              "5️⃣ Atención al cliente\n" +
              "6️⃣ Otros",
          );
        } else if (normalized === "2") {
          state = "info_servicios";
          ctxData.menu_opcion = "info_servicios";
          replies.push(
            "Ofrecemos soluciones de automatización en ventas, marketing, finanzas, operaciones y atención al cliente.\n\n" +
              "Podés ver más info en https://digitalmatchglobal.com\n" +
              "Y si querés, decime en qué área puntual estás pensando 🤖",
          );
        } else if (normalized === "3") {
          state = "esperando_contacto";
          ctxData.menu_opcion = "contactar_asesor";

          replies.push(
            "¿Cómo preferís que te contactemos?\n" +
              "1️⃣ Agendar una videollamada 📅\n" +
              "2️⃣ Que un asesor te escriba por WhatsApp 📲\n" +
              "3️⃣ Que un asesor te envíe un email 📧",
          );
        } else {
          replies.push(
            "Por favor, seleccioná una opción válida (1, 2 o 3).\n" +
              "Escribí 'Salir' para reiniciar.",
          );
        }
        break;
      }

      case "esperando_contacto": {
        if (normalized === "1") {
          // Videollamada
          state = null; // flujo cerrado
          ctxData.modo_contacto = "videollamada";
          replies.push(
            "📅 Podés agendar una consulta directamente acá:\n" +
              "🔗 https://calendly.com/digitalmatch-global/30min\n\n" +
              "¡Espero tu reserva! 😊",
          );
        } else if (normalized === "2") {
          // Contacto por WhatsApp
          state = null;
          ctxData.modo_contacto = "whatsapp";
          replies.push(
            "Perfecto 🙌 Un asesor se va a poner en contacto con vos por WhatsApp.",
          );
        } else if (normalized === "3") {
          // Pedir email
          state = "esperando_email";
          ctxData.modo_contacto = "email";
          replies.push(
            "Buenísimo, enviame tu email para que podamos contactarte 📧",
          );
        } else {
          replies.push(
            "Por favor, seleccioná una opción válida (1, 2 o 3).",
          );
        }
        break;
      }

      case "esperando_email": {
        if (normalized.includes("@")) {
          state = null;
          ctxData.email = text.trim();
          replies.push(
            "¡Gracias! 🙌 Nos vamos a poner en contacto con vos a ese correo.",
          );
        } else {
          replies.push("Por favor, ingresá un email válido 📧");
        }
        break;
      }

      case "esperando_area": {
        if (["1", "2", "3", "4", "5"].includes(normalized)) {
          state = "esperando_tipo_automatizacion";
          ctxData.area = areaMap[normalized] ?? `Área código ${normalized}`;
          replies.push(
            "¡Perfecto! Ahora contame qué tipo de automatización necesitás:\n" +
              "1️⃣ CRM\n" +
              "2️⃣ Gestión de clientes\n" +
              "3️⃣ Análisis de datos\n" +
              "4️⃣ Otros",
          );
        } else if (normalized === "6") {
          state = "esperando_area_otro";
          replies.push(
            "Contame en qué área necesitás automatización, con tus palabras 👇",
          );
        } else {
          replies.push(
            "Por favor, seleccioná un número válido entre 1 y 6.",
          );
        }
        break;
      }

      case "esperando_area_otro": {
        ctxData.area_otro = text.trim();
        state = "esperando_tipo_automatizacion";
        replies.push(
          "¡Gracias! 🙌 Ahora decime qué tipo de automatización tenés en mente:\n" +
            "1️⃣ CRM\n" +
            "2️⃣ Gestión de clientes\n" +
            "3️⃣ Análisis de datos\n" +
            "4️⃣ Otros",
        );
        break;
      }

      case "esperando_tipo_automatizacion": {
        if (["1", "2", "3"].includes(normalized)) {
          state = null;
          ctxData.tipo_automatizacion =
            automationTypeMap[normalized] ??
            `Tipo automatización código ${normalized}`;

          replies.push(
            "¡Excelente! 🙌 Con esa info ya podemos entender mejor tu necesidad.\n" +
              "Un asesor se va a poner en contacto con vos para profundizar y darte una propuesta.",
          );
        } else if (normalized === "4") {
          state = "esperando_tipo_otro";
          replies.push(
            "Genial, contame qué tipo de automatización necesitás con tus palabras 👇",
          );
        } else {
          replies.push(
            "Por favor, seleccioná un número válido entre 1 y 4.",
          );
        }
        break;
      }

      case "esperando_tipo_otro": {
        ctxData.tipo_automatizacion_otro = text.trim();
        state = null;
        replies.push(
          "¡Gracias! 🙌 Un asesor se va a poner en contacto con vos para entender mejor tu necesidad y proponerte una solución.",
        );
        break;
      }

      case "info_servicios": {
        const txt = normalized;

        const mentionsVentas = txt.includes("venta");
        const mentionsMkt = txt.includes("marketing");
        const mentionsFinanzas = txt.includes("finanza");
        const mentionsOper = txt.includes("operacion") ||
          txt.includes("operación");
        const mentionsAtc =
          txt.includes("atencion al cliente") ||
          txt.includes("atención al cliente") ||
          (txt.includes("cliente") && txt.includes("atencion"));

        if (
          mentionsVentas ||
          mentionsMkt ||
          mentionsFinanzas ||
          mentionsOper ||
          mentionsAtc
        ) {
          state = "esperando_area";
          ctxData.menu_opcion = "automatizar_procesos_desde_info";
          replies.push(
            "¡Genial! Justamente podemos ayudarte a automatizar en esa área 💪\n\n" +
              "¿En qué área necesitás automatizar?\n" +
              "1️⃣ Ventas\n" +
              "2️⃣ Marketing\n" +
              "3️⃣ Finanzas\n" +
              "4️⃣ Operaciones\n" +
              "5️⃣ Atención al cliente\n" +
              "6️⃣ Otros",
          );
        } else if (politeWords.includes(normalized)) {
          replies.push(
            "¡De nada! 😊 Si querés más detalles, podés preguntarme por *precios*, *integraciones*, *duración* o *seguridad*.",
          );
        } else {
          // Te vuelvo a encarrilar al menú
          state = "menu_principal";
          replies.push(
            "No terminé de entender tu mensaje 🤔\n\n" +
              buildMainMenuMessage(),
          );
        }
        break;
      }

      case "esperando_presupuesto": {
        ctxData.budget_details = text.trim();
        state = null;
        replies.push(
          "¡Gracias! 🙌 Vamos a analizar tu requerimiento y un asesor se va a poner en contacto con vos con una propuesta de presupuesto.",
        );
        break;
      }

      default: {
        // Estado desconocido → reset a menú
        state = "menu_principal";
        replies.push(buildMainMenuMessage());
        break;
      }
    }
  }

  if (replies.length === 0) {
    return false;
  }

  // Actualizar contexto en conversations
  const nowIso = new Date().toISOString();
  try {
    await supabase
      .from("conversations")
      .update({
        context_state: state,
        context_data: ctxData,
        last_message_at: nowIso,
      })
      .eq("id", conv.id);
  } catch (e) {
    console.error("Error updating conversation context_state/context_data:", e);
  }

  // Enviar respuestas por WhatsApp
  const token = resolveMetaToken(channel.token_alias ?? null);
  if (!token) {
    console.error(
      "No Meta token for channel token_alias (state machine):",
      channel.token_alias,
    );
    return false;
  }

  for (const replyText of replies) {
    if (!replyText) continue;

    try {
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
            to: from,
            text: { body: replyText },
          }),
        },
      );

      await supabase.from("messages").insert({
        conversation_id: conv.id,
        tenant_id: tenantId,
        channel_id: channel.id,
        direction: "out",
        sender: "bot",
        body: replyText,
        meta: {
          via: "dm-state-machine",
          context_state: state,
        },
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Error sending WhatsApp message (state machine):", e);
    }
  }

  return true;
}

// 🔌 FUNCIÓN PÚBLICA QUE USA EL WEBHOOK
// - Si DM_TENANT_IDS está vacío → corre la state machine para TODOS los tenants
// - Si DM_TENANT_IDS tiene valores → solo corre para esos tenants
export async function runStateMachineForTenant(
  options: StateMachineOptions,
): Promise<boolean> {
  const { tenantId } = options;

  const dmTenants = getDmTenantIds();

  // Caso 1: no hay lista → aplica a todos
  if (dmTenants.length === 0) {
    return await runDmStateMachine(options);
  }

  // Caso 2: hay lista → solo estos tenants usan state machine
  if (!dmTenants.includes(tenantId)) {
    return false;
  }

  return await runDmStateMachine(options);
}
