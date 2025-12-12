// ... (mantén todo el código anterior igual)

/**
 * NUEVA FUNCIÓN: Envía un mensaje de plantilla (Test Send).
 * Llama a la edge function 'whatsapp-send-message'.
 */
export async function sendTemplateMessage({ channelId, to, templateName, language, components }) {
  if (!channelId || !to || !templateName) {
    throw new Error("Missing required parameters for sending template");
  }

  // Estructura payload estándar de Meta
  const payload = {
    channelId, // Tu Edge Function debe saber manejar esto para buscar el token
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: components || []
    }
  };

  const { data, error } = await supabase.functions.invoke("whatsapp-send-message", {
    body: payload
  });

  if (error) {
    console.error("[templatesApi] sendTemplateMessage error:", error);
    throw error;
  }

  return data;
}