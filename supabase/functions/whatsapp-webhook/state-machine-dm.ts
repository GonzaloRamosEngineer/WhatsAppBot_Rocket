// supabase/functions/whatsapp-webhook/state-machine-dm.ts

// --- Tipos básicos de la conversación y el canal ---
export type ConversationRow = {
  id: string;
  tenant_id: string;
  channel_id: string;
  contact_phone: string;
  status: string;
  last_message_at: string | null;
  context_state?: string | null;
  context_data?: any | null;
};

export type ChannelRow = {
  id: string;
  tenant_id: string;
  type: string;
  phone: string;
  phone_id: string;
  token_alias?: string | null;
};

export type StateMachineOptions = {
  supabase: any;
  tenantId: string;
  channel: ChannelRow;
  conv: ConversationRow;
  from: string;
  text: string;
  isNewConversation: boolean;
};

// --- Palabras globales / comandos ---
// Comando de menú
const menuWords = ["menu", "menú"];
// Palabras “amables” tipo gracias / ok (opcional)
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

// Mapas de contexto (siguen siendo útiles)
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

// 🧾 MENSAJE DE MENÚ PRINCIPAL (solo lo usamos en casos especiales como SALIR)
// El texto “normal” del menú viene desde Flow Builder (rules_v1).
function buildMainMenuMessage() {
  return (
    "¡Hola de nuevo! Soy el asistente virtual de DigitalMatchGlobal 🚀\n\n" +
    "¿Qué tipo de ayuda necesitás ahora? Respondé con el número de la opción:\n\n" +
    "1️⃣ Automatizar procesos\n" +
    "2️⃣ Información sobre servicios\n" +
    "3️⃣ Contactar con un asesor (WhatsApp, correo o videollamada)\n\n" +
    "Recordá:\n" +
    "• Podés escribir \"menu\" cuando quieras para volver a ver estas opciones.\n" +
    "• Podés escribir \"salir\" para reiniciar la conversación."
  );
}

/**
 * 🧠 STATE MACHINE “LIVIANA” PARA DIGITALMATCH
 *
 * Objetivo:
 * - Manejar únicamente cosas que requieren MEMORIA/ESTADO:
 *   - Menú numérico (1, 2, 3)
 *   - Subopciones de contacto
 *   - Captura de email
 *   - Flujos de automatizar procesos (área + tipo)
 *
 * - Dejar todo lo demás (precios, países, soporte, fallback, cierre amistoso, etc.)
 *   en manos del motor de reglas (rules_v1) del Flow Builder.
 *
 * Convención:
 * - Si la state machine genera respuestas → devuelve true (whatsapp-webhook NO llama a rules_v1)
 * - Si la state machine SOLO actualiza contexto o no hace nada → devuelve false
 *   (whatsapp-webhook llama a rules_v1 y usa el contenido del flow configurado).
 */
export async function runStateMachineForTenant(
  options: StateMachineOptions,
): Promise<boolean> {
  const { supabase, tenantId, channel, conv, from, text, isNewConversation } =
    options;

  const normalized = text.trim().toLowerCase();

  let state: string | null = conv.context_state ?? null;
  let ctxData: any = conv.context_data ?? {};
  const replies: string[] = [];

  // 0) Comando global: SALIR → resetea todo y muestra menú (texto desde acá)
  if (normalized === "salir") {
    state = "menu_principal";
    ctxData = {};
    replies.push("🔄 Conversación reiniciada.\n\n" + buildMainMenuMessage());
  }
  // 1) Comando global: MENU (no respondo yo → dejo que rules_v1 muestre el menú)
  else if (menuWords.includes(normalized)) {
    state = "menu_principal";
    ctxData = {
      ...ctxData,
      last_command: "menu",
    };
    // 👇 NO pusheo ningún reply: dejo que rules_v1 responda
  }
  // 2) Palabras “amables” cuando HAY un estado activo → respondo algo corto
  else if (state && politeWords.includes(normalized)) {
    replies.push(
      "¡Genial! 😊 Si necesitás más ayuda, podés volver a escribir \"menu\" o contarme qué necesitás.",
    );
  }
  // 3) Conversación nueva o user dice "hola" sin estado:
  //    - Solo actualizo contexto a menu_principal.
  //    - El texto de bienvenida/menú viene de rules_v1 (welcome / Menú principal).
  else if (!state && (isNewConversation || normalized === "hola")) {
    state = "menu_principal";
    ctxData = {
      ...ctxData,
      started_at: new Date().toISOString(),
    };
    // Sin replies: dejo todo el copy al Flow Builder
  } else {
    // 4) Si hay un estado vigente, proceso flujo numérico
    switch (state) {
      case "menu_principal": {
        // 1 → Automatizar procesos
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
        }
        // 2 → Info sobre servicios
        else if (normalized === "2") {
          state = "info_servicios";
          ctxData.menu_opcion = "info_servicios";
          replies.push(
            "Ofrecemos soluciones de automatización en ventas, marketing, finanzas, operaciones y atención al cliente 🤖\n\n" +
              "Podés ver más detalles en nuestro sitio web:\n" +
              "https://digitalmatchglobal.com\n\n" +
              "Si querés, decime en qué área puntual estás pensando.",
          );
        }
        // 3 → Contactar con un asesor
        else if (normalized === "3") {
          state = "esperando_contacto";
          ctxData.menu_opcion = "contactar_asesor";

          replies.push(
            "¿Cómo preferís que te contactemos? Respondé con el número de la opción:\n\n" +
              "1️⃣ Agendar una videollamada 📅\n" +
              "2️⃣ Que un asesor te escriba por WhatsApp 📲\n" +
              "3️⃣ Que un asesor te envíe un email 📧",
          );
        } else if (normalized) {
          replies.push(
            "Por favor, seleccioná una opción válida (1, 2 o 3).\n" +
              "Escribí 'salir' para reiniciar o 'menu' para ver las opciones.",
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
        } else if (normalized) {
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
        } else if (normalized) {
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
        } else if (normalized) {
          replies.push(
            "Por favor, seleccioná un número válido entre 1 y 6.",
          );
        }
        break;
      }

      case "esperando_area_otro": {
        if (normalized) {
          ctxData.area_otro = text.trim();
          state = "esperando_tipo_automatizacion";
          replies.push(
            "¡Gracias! 🙌 Ahora decime qué tipo de automatización tenés en mente:\n" +
              "1️⃣ CRM\n" +
              "2️⃣ Gestión de clientes\n" +
              "3️⃣ Análisis de datos\n" +
              "4️⃣ Otros",
          );
        }
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
        } else if (normalized) {
          replies.push(
            "Por favor, seleccioná un número válido entre 1 y 4.",
          );
        }
        break;
      }

      case "esperando_tipo_otro": {
        if (normalized) {
          ctxData.tipo_automatizacion_otro = text.trim();
          state = null;
          replies.push(
            "¡Gracias! 🙌 Un asesor se va a poner en contacto con vos para entender mejor tu necesidad y proponerte una solución.",
          );
        }
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

        if (mentionsVentas || mentionsMkt || mentionsFinanzas || mentionsOper ||
          mentionsAtc) {
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
            "¡De nada! 😊 Si querés más detalles, podés preguntarme por precios, integraciones, duración o seguridad.",
          );
        } else if (normalized) {
          // Te vuelvo a encarrilar al menú
          state = "menu_principal";
          replies.push(
            "No terminé de entender tu mensaje 🤔\n\n" +
              buildMainMenuMessage(),
          );
        }
        break;
      }

      default: {
        // Estado desconocido → reset a menú
        if (state) {
          state = "menu_principal";
          replies.push(buildMainMenuMessage());
        }
        break;
      }
    }
  }

  // Si NO hay replies, esta función no se hace cargo → que responda rules_v1
  if (replies.length === 0) {
    // Igual actualizo contexto si cambió algo
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

    return false;
  }

  // Si llegamos acá, la state machine SÍ respondió algo → enviamos por WhatsApp
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
