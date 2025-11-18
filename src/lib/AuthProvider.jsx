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
  const [loading, setLoading] = useState(true);

  // Cargar sesión inicial + suscripción a cambios de auth
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      console.log("[AuthProvider] init.getSession()", { data, error });

      if (error) {
        console.error("Error getting session", error);
        setLoading(false);
        return;
      }

      setSession(data.session);

      if (data.session?.user) {
        await loadTenantsAndProfile(data.session.user.id);
      }

      setLoading(false);
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

    // data.session y data.user vienen de Supabase
    setSession(data.session);

    if (data.user) {
      await loadTenantsAndProfile(data.user.id);
    }

    setLoading(false);
    // El LoginForm solo usa ok + error, pero dejamos session por si lo querés
    return { ok: true, session: data.session };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setTenants([]);
  };

  const value = {
    session,
    profile,   // { role, tenant_id, tenant }
    tenants,   // lista completa de memberships
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
