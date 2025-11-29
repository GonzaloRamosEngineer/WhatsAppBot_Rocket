// C:\Projects\WhatsAppBot_Rocket\src\lib\AuthProvider.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // { role, tenant_id, tenant }
  const [tenants, setTenants] = useState([]);   // lista de memberships
  const [loading, setLoading] = useState(true); // SOLO “ya sé si hay sesión o no”

  const loadTenantsAndProfile = async (userId) => {
    if (!userId) {
      console.warn("[AuthProvider] loadTenantsAndProfile sin userId");
      setProfile(null);
      setTenants([]);
      return;
    }

    try {
      console.log("[AuthProvider] loadTenantsAndProfile userId", userId);

      // 1) Aseguramos que exista al menos un tenant asociado al usuario.
      //    Esto lo hace la función SQL init_tenant_if_empty(p_user_id uuid).
      try {
        const { data: initResult, error: initError } = await supabase.rpc(
          "init_tenant_if_empty",
          { p_user_id: userId }
        );

        if (initError) {
          console.warn(
            "[AuthProvider] init_tenant_if_empty error",
            initError
          );
        } else {
          console.log(
            "[AuthProvider] init_tenant_if_empty resultado",
            initResult
          );
        }
      } catch (rpcErr) {
        console.error(
          "[AuthProvider] RPC init_tenant_if_empty falló (revisar que exista la función en la BD)",
          rpcErr
        );
      }

      // 2) Leemos memberships actualizados
      const { data, error } = await supabase
        .from("tenant_members")
        .select("role, tenant_id, tenants ( name, slug )")
        .eq("user_id", userId);

      console.log("[AuthProvider] tenant_members result", { data, error });

      if (error) {
        console.error("Error loading profile/tenants", error);
        setProfile(null);
        setTenants([]);
        return;
      }

      const rows = data || [];
      setTenants(rows);

      if (rows.length === 0) {
        // Caso muy raro: no hay tenant ni siquiera después de init_tenant_if_empty
        setProfile({
          role: "tenant",
          tenant_id: null,
          tenant: null,
        });
        return;
      }

      // Si tiene varios tenants, preferimos uno con rol "owner", si no el primero
      let chosen = rows[0];
      const owner = rows.find((t) => t.role === "owner");
      if (owner) {
        chosen = owner;
      }

      setProfile({
        role: chosen.role || "tenant",
        tenant_id: chosen.tenant_id || null,
        tenant: chosen.tenants || null, // { name, slug }
      });
    } catch (e) {
      console.error("Unexpected error loading profile", e);
      setProfile(null);
      setTenants([]);
    }
  };

  // Cargar sesión inicial + suscripción a cambios de auth
  useEffect(() => {
    const init = async () => {
      setLoading(true); // Estamos averiguando si hay sesión

      try {
        const { data, error } = await supabase.auth.getSession();

        console.log("[AuthProvider] init.getSession()", { data, error });

        if (error) {
          console.error("Error getting session", error);
          setSession(null);
          setProfile(null);
          setTenants([]);
        } else {
          const currentSession = data.session ?? null;
          setSession(currentSession);

          if (currentSession?.user) {
            await loadTenantsAndProfile(currentSession.user.id);
          } else {
            setProfile(null);
            setTenants([]);
          }
        }
      } catch (e) {
        console.error("[AuthProvider] unexpected error in getSession", e);
        setSession(null);
        setProfile(null);
        setTenants([]);
      } finally {
        // Ya sabemos si hay sesión o no
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthProvider] onAuthStateChange", { event, session });

      // Auth cambió → actualizamos sesión
      setSession(session ?? null);

      if (session?.user) {
        await loadTenantsAndProfile(session.user.id);
      } else {
        setProfile(null);
        setTenants([]);
      }

      setLoading(false); // Ya tenemos respuesta de auth
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true); // estamos intentando loguear

    console.log("[AuthProvider] login() called", { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("[AuthProvider] login result", { data, error });

    if (error) {
      setLoading(false);
      return { ok: false, error };
    }

    const currentSession = data.session ?? null;
    setSession(currentSession);

    if (currentSession?.user) {
      await loadTenantsAndProfile(currentSession.user.id);
    } else {
      setProfile(null);
      setTenants([]);
    }

    setLoading(false); // ya sabemos si el login fue correcto

    return { ok: true, session: currentSession };
  };

  const logout = async () => {
    console.log("[AuthProvider] logout() called");
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("[AuthProvider] logout error", e);
    } finally {
      setSession(null);
      setProfile(null);
      setTenants([]);
      setLoading(false);
    }
  };

  // Conveniencia: tenant actual como objeto { id, name, slug }
  const tenant =
    profile?.tenant_id
      ? {
          id: profile.tenant_id,
          name: profile.tenant?.name || null,
          slug: profile.tenant?.slug || null,
        }
      : null;

  const value = {
    session,
    profile,   // { role, tenant_id, tenant }
    tenant,    // { id, name, slug } o null
    tenants,   // lista completa de memberships
    loading,   // SOLO auth (saber si hay sesión)
    login,
    logout,
    supabase,  // para usar en páginas / hooks
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
