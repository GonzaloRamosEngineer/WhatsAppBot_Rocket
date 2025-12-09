// supabase/functions/facebook-oauth-callback/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID")!;
const FACEBOOK_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET")!;
const OAUTH_REDIRECT_URL = Deno.env.get("OAUTH_REDIRECT_URL")!;
const DEFAULT_REDIRECT = "/channel-setup";
const DEFAULT_ORIGIN = "https://matchbot.digitalmatchglobal.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? DEFAULT_ORIGIN;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, apikey, x-client-info",
    "Access-Control-Max-Age": "86400",
  };
}

function json(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...buildCorsHeaders(req),
    },
  });
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { code, state } = await req.json();

    if (!code || !state) {
      return json(req, { error: "Missing code or state" }, 400);
    }

    // 1) Buscar el state (tenant + user + redirect)
    const { data: oauthState, error: stateError } = await supabase
      .from("oauth_states")
      .select("id, tenant_id, user_id, provider, redirect_to, created_at")
      .eq("id", state)
      .single();

    if (stateError || !oauthState) {
      console.error("oauth_states error:", stateError);
      return json(req, { error: "Invalid or expired state" }, 400);
    }

    // 2) Intercambiar code -> short-lived token
    const tokenUrl = new URL(
      "https://graph.facebook.com/v20.0/oauth/access_token",
    );
    tokenUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
    tokenUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
    tokenUrl.searchParams.set("redirect_uri", OAUTH_REDIRECT_URL);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString(), { method: "GET" });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("FB short-lived token error:", errBody);
      return json(req, { error: "Error getting Facebook access token" }, 500);
    }

    const shortToken = await tokenRes.json() as {
      access_token: string;
      token_type?: string;
      expires_in?: number;
    };

    let accessToken = shortToken.access_token;
    let expiresIn = shortToken.expires_in ?? (60 * 60 * 2);

    // 3) Intentar long-lived token (best effort)
    try {
      const longUrl = new URL(
        "https://graph.facebook.com/v20.0/oauth/access_token",
      );
      longUrl.searchParams.set("grant_type", "fb_exchange_token");
      longUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
      longUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
      longUrl.searchParams.set("fb_exchange_token", accessToken);

      const longRes = await fetch(longUrl.toString(), { method: "GET" });

      if (longRes.ok) {
        const longToken = await longRes.json() as {
          access_token: string;
          token_type?: string;
          expires_in?: number;
        };

        if (longToken.access_token) {
          accessToken = longToken.access_token;
          expiresIn = longToken.expires_in ?? expiresIn;
        }
      } else {
        const errBody = await longRes.text();
        console.warn(
          "FB long-lived token failed, using short-lived:",
          errBody,
        );
      }
    } catch (e) {
      console.warn("FB long-lived token exception, using short-lived:", e);
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 4) Guardar en meta_tokens con alias 'default'
    const { error: insertError } = await supabase.from("meta_tokens").insert({
      tenant_id: oauthState.tenant_id,
      user_id: oauthState.user_id,
      provider: "facebook",
      alias: "default",
      access_token: accessToken,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("meta_tokens insert error:", insertError);
      return json(req, { error: "Error saving token" }, 500);
    }

    // 5) Limpiar state usado
    await supabase.from("oauth_states").delete().eq("id", oauthState.id);

    return json(req, {
      ok: true,
      redirect_to: oauthState.redirect_to ?? DEFAULT_REDIRECT,
    });
  } catch (e) {
    console.error("facebook-oauth-callback exception:", e);
    return json(req, { error: "Internal server error" }, 500);
  }
});
