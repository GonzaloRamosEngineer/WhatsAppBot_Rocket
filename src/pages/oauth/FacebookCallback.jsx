import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthProvider";
import Icon from "../../components/AppIcon";

function useQuery() {
  const location = useLocation();
  return new URLSearchParams(location.search);
}

const FacebookCallback = () => {
  const { supabase } = useAuth();
  const navigate = useNavigate();
  const query = useQuery();

  const [status, setStatus] = useState("Procesando autenticación con Meta...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const code = query.get("code");
        const state = query.get("state");
        const error = query.get("error");

        if (error || !code || !state) {
          console.error("[FacebookCallback] error en query", {
            error,
            code,
            state,
          });
          setStatus("No se pudo completar la autenticación con Meta.");
          setIsError(true);

          // Avisar a la ventana padre (si es popup)
          if (window.opener) {
            window.opener.postMessage(
              { type: "facebook_oauth_error", error },
              window.location.origin
            );
            window.close();
          }
          return;
        }

        if (!supabase) {
          setStatus("Error interno: supabase no está inicializado.");
          setIsError(true);
          return;
        }

        // Llamar a la edge function para intercambiar code → access_token
        const { data, error: fnError } = await supabase.functions.invoke(
          "facebook-oauth-callback",
          {
            body: { code, state },
          }
        );

        if (fnError) {
          console.error("[FacebookCallback] error en edge function", fnError);
          setStatus("Ocurrió un error al conectar con Meta.");
          setIsError(true);

          if (window.opener) {
            window.opener.postMessage(
              { type: "facebook_oauth_error", error: fnError.message },
              window.location.origin
            );
            window.close();
          }
          return;
        }

        console.log("[FacebookCallback] conexión con Meta OK", data);
        setStatus("¡Conexión con Meta completada! Ya podés cerrar esta ventana.");

        // Avisar éxito a la ventana padre
        if (window.opener) {
          window.opener.postMessage(
            { type: "facebook_oauth_success" },
            window.location.origin
          );
          // Pequeño delay para que se vea el mensaje 1s
          setTimeout(() => window.close(), 1000);
        } else {
          // Si por algún motivo no es popup, redirigimos al channel setup
          setTimeout(() => navigate("/channel-setup"), 1200);
        }
      } catch (e) {
        console.error("[FacebookCallback] error inesperado", e);
        setStatus("Ocurrió un error inesperado al procesar la autenticación.");
        setIsError(true);

        if (window.opener) {
          window.opener.postMessage(
            { type: "facebook_oauth_error", error: e.message },
            window.location.origin
          );
          window.close();
        }
      }
    };

    run();
  }, [supabase, navigate, query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <Icon
            name={isError ? "AlertCircle" : "Loader2"}
            size={32}
            className={isError ? "text-destructive" : "text-primary animate-spin-slow"}
          />
        </div>
        <h1 className="text-lg font-semibold mb-2">
          Conexión con Meta (Facebook)
        </h1>
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

export default FacebookCallback;
