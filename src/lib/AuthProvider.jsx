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
  const [loading, setLoading] = useState(true);

  const loadTenantsAndProfile = async (userId) => {
    try {
      console.log("[AuthProvider] loadTenantsAndProfile userId", userId);

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
      setProfile(null);
      setTenants([]);
    }
  };

  // Cargar sesión inicial + suscripción a cambios de auth
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        console.log("[AuthProvider] init.getSession()", { data, error });

        if (error) {
          console.error("Error getting session", error);
          setSession(null);
          setProfile(null);
          setTenants([]);
        } else {
          setSession(data.session);

          if (data.session?.user) {
            await loadTenantsAndProfile(data.session.user.id);
          } else {
            setProfile(null);
            setTenants([]);
          }
        }
      } catch (e) {
        if (!mounted) return;
        console.error("[AuthProvider] unexpected error in getSession", e);
        // En cualquier error dejamos todo limpio pero NO nos quedamos cargando
        setSession(null);
        setProfile(null);
        setTenants([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("[AuthProvider] onAuthStateChange", { event, session });

      setSession(session);

      if (session?.user) {
        await loadTenantsAndProfile(session.user.id);
      } else {
        setProfile(null);
        setTenants([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);

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

    setSession(data.session);

    if (data.user) {
      await loadTenantsAndProfile(data.user.id);
    } else {
      setProfile(null);
      setTenants([]);
    }

    setLoading(false);
    return { ok: true, session: data.session };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setTenants([]);
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
    loading,
    login,
    logout,
    supabase,  // para usar en páginas / hooks
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
