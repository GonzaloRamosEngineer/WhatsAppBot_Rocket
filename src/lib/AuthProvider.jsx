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
  const [profile, setProfile] = useState(null);   // { role, tenant_id, tenant }
  const [tenants, setTenants] = useState([]);     // lista de memberships

  // 🔹 loading = SOLO estado de autenticación (saber si hay sesión o no)
  const [loading, setLoading] = useState(true);

  // 🔹 Carga de tenants + perfil (NO toca "loading", así ProtectedRoute no se queda colgado)
  const loadTenantsAndProfile = async (userId) => {
    if (!userId) {
      console.warn("[AuthProvider] loadTenantsAndProfile sin userId");
      setProfile(null);
      setTenants([]);
      return;
    }

    try {
      console.log("[AuthProvider] loadTenantsAndProfile userId", userId);

      // 1) Asegurar que exista al menos un tenant para este usuario.
      //    Usa la versión SIN parámetros: init_tenant_if_empty()
      try {
        const { data: initResult, error: initError } = await supabase.rpc(
          "init_tenant_if_empty"
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
          "[AuthProvider] RPC init_tenant_if_empty falló (revisar definiciones / RLS)",
          rpcErr
        );
      }

      // 2) Leemos memberships del usuario
      const { data, error } = await supabase
        .from("tenant_members")
        .select("role, tenant_id, tenants ( name, slug )")
        .eq("user_id", userId);

      console.log("[AuthProvider] tenant_members result", { data, error });

      if (error) {
        console.error("Error loading profile/tenants", error);
        setProfile({
          role: "tenant",
          tenant_id: null,
          tenant: null,
        });
        setTenants([]);
        return;
      }

      const rows = data || [];
      setTenants(rows);

      if (rows.length === 0) {
        // Usuario sin tenant asociado todavía
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
      setProfile({
        role: "tenant",
        tenant_id: null,
        tenant: null,
      });
      setTenants([]);
    }
  };

  // 🔹 Efecto 1: descubrir sesión inicial + suscribirnos a cambios de auth
  useEffect(() => {
    const init = async () => {
      setLoading(true); // estamos averiguando si hay o no sesión

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
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("[AuthProvider] onAuthStateChange", { event, session: newSession });

      setSession(newSession ?? null);
      // En cuanto Supabase nos dice el nuevo estado de sesión, dejamos de "cargar sesión"
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 🔹 Efecto 2: cada vez que cambia el userId, cargamos perfil y tenants
  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId) {
      // No hay usuario logueado => limpiamos perfil
      setProfile(null);
      setTenants([]);
      return;
    }

    // Cargamos perfil/tenants en background (no bloquea ProtectedRoute)
    loadTenantsAndProfile(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // 🔹 Login
  const login = async (email, password) => {
    setLoading(true); // estamos iniciando sesión

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

    // onAuthStateChange también se va a disparar, pero ya dejamos el loading en false
    setLoading(false);

    return { ok: true, session: currentSession };
  };

  // 🔹 Logout
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

  // 🔹 Conveniencia: tenant actual como objeto { id, name, slug }
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
    loading,   // SOLO estado de auth (saber si hay sesión)
    login,
    logout,
    supabase,  // para usar en páginas / hooks
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
