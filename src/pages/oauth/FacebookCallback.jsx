import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthProvider";
import Icon from "../../components/AppIcon";

/**
 * Combina parámetros de query (?a=1) y hash (#b=2) en un solo URLSearchParams.
 * Facebook a veces manda errores en el hash.
 */
function useFacebookParams() {
  const location = useLocation();

  return useMemo(() => {
    const searchParams = new URLSearchParams(location.search || "");

    if (location.hash && location.hash.startsWith("#")) {
      const hashParams = new URLSearchParams(location.hash.substring(1));
      hashParams.forEach((value, key) => {
        if (!searchParams.has(key)) {
          searchParams.set(key, value);
        }
      });
    }

    return searchParams;
  }, [location]);
}

const FacebookCallback = () => {
  const { supabase } = useAuth();
  const navigate = useNavigate();
  const params = useFacebookParams();

  const [status, setStatus] = useState(
    "Processing authentication with Meta..."
  );
  const [isError, setIsError] = useState(false);
  const [metaErrorDetails, setMetaErrorDetails] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        const code = params.get("code");
        const state = params.get("state");

        // Posibles campos de error que manda FB
        const error = params.get("error") || params.get("error_reason");
        const errorCode = params.get("error_code");
        const errorDescription = params.get("error_description");
        const errorMessage =
          params.get("error_message") || params.get("message");

        const hasErrorFlags = !!(error || errorCode || errorDescription || errorMessage);

        // Guardamos todo lo que venga de Meta para debug fino
        const allParams = {};
        params.forEach((value, key) => {
          allParams[key] = value;
        });

        // Caso: Meta devolvió error o no nos dio code/state válidos
        if (hasErrorFlags || !code || !state) {
          console.error("[FacebookCallback] error en query de Meta", {
            code,
            state,
            error,
            errorCode,
            errorDescription,
            errorMessage,
            allParams,
          });

          setMetaErrorDetails({
            code,
            state,
            error,
            errorCode,
            errorDescription,
            errorMessage,
            allParams,
          });

          // Mensaje principal más legible
          let humanMsg = "No se pudo completar la autenticación con Meta.";
          const detailPieces = [];

          if (error) detailPieces.push(`Error: ${error}`);
          if (errorCode) detailPieces.push(`Código: ${errorCode}`);
          if (errorDescription) detailPieces.push(`Descripción: ${errorDescription}`);
          if (errorMessage && errorMessage !== errorDescription) {
            detailPieces.push(`Mensaje: ${errorMessage}`);
          }

          if (detailPieces.length > 0) {
            humanMsg += " Detalle de Meta: " + detailPieces.join(" | ");
          }

          setStatus(humanMsg);
          setIsError(true);

          // Avisar a la ventana padre (si es popup)
          if (window.opener) {
            window.opener.postMessage(
              {
                type: "facebook_oauth_error",
                error,
                errorCode,
                errorDescription,
                errorMessage,
                params: allParams,
              },
              window.location.origin
            );
            // Dejamos la ventana abierta un toque para que se vea el mensaje
            setTimeout(() => window.close(), 1500);
          }

          return;
        }

        if (!supabase) {
          setStatus("Error interno: Supabase no está inicializado.");
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
          console.error(
            "[FacebookCallback] error en edge function facebook-oauth-callback",
            fnError
          );
          setStatus("Ocurrió un error al conectar con Meta (edge function).");
          setIsError(true);

          if (window.opener) {
            window.opener.postMessage(
              {
                type: "facebook_oauth_error",
                error: fnError.message,
                edgeError: fnError,
              },
              window.location.origin
            );
            setTimeout(() => window.close(), 1500);
          }
          return;
        }

        console.log("[FacebookCallback] conexión con Meta OK", data);
        setStatus(
          "¡Connection to Meta complete! You can now close this window."
        );

        // Avisar éxito a la ventana padre
        if (window.opener) {
          window.opener.postMessage(
            { type: "facebook_oauth_success", data },
            window.location.origin
          );
          setTimeout(() => window.close(), 1000);
        } else {
          // Si por algún motivo no es popup, redirigimos al channel setup
          setTimeout(() => navigate("/channel-setup"), 1200);
        }
      } catch (e) {
        console.error("[FacebookCallback] error inesperado", e);
        setStatus(
          "Ocurrió un error inesperado al procesar la autenticación."
        );
        setIsError(true);

        if (window.opener) {
          window.opener.postMessage(
            {
              type: "facebook_oauth_error",
              error: e.message,
              stack: e.stack,
            },
            window.location.origin
          );
          setTimeout(() => window.close(), 1500);
        }
      }
    };

    run();
    // params es estable por useMemo; cambia cuando cambia location
  }, [supabase, navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <Icon
            name={isError ? "AlertCircle" : "Loader2"}
            size={32}
            className={
              isError
                ? "text-destructive"
                : "text-primary animate-spin-slow"
            }
          />
        </div>
        <h1 className="text-lg font-semibold mb-2">
          Connection with Meta (Facebook)
        </h1>
        <p className="text-sm text-muted-foreground">{status}</p>

        {isError && metaErrorDetails && (
          <div className="mt-4 text-left text-xs bg-destructive/5 border border-destructive/20 rounded-md p-3 font-mono text-destructive">
            <div className="font-semibold mb-1">
              Detalle técnico devuelto por Meta:
            </div>
            {metaErrorDetails.error && (
              <div>Error: {metaErrorDetails.error}</div>
            )}
            {metaErrorDetails.errorCode && (
              <div>Código: {metaErrorDetails.errorCode}</div>
            )}
            {metaErrorDetails.errorDescription && (
              <div>Descripción: {metaErrorDetails.errorDescription}</div>
            )}
            {metaErrorDetails.errorMessage &&
              metaErrorDetails.errorMessage !==
                metaErrorDetails.errorDescription && (
                <div>Mensaje: {metaErrorDetails.errorMessage}</div>
              )}
            {metaErrorDetails.code && (
              <div>Param code (OAuth): {metaErrorDetails.code}</div>
            )}
            {metaErrorDetails.state && (
              <div>State: {metaErrorDetails.state}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacebookCallback;
