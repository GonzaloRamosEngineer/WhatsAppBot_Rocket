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
  const [loading, setLoading] = useState(true);

  // Cargar sesión inicial + suscripción a cambios de auth
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Error getting session", error);
      } else {
        setSession(data.session);
        if (data.session?.user) {
          await loadProfile(data.session.user);
        }
      }
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        await loadProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (user) => {
    try {
      // Ajustá nombres de tablas/relaciones según lo que tengas
      const { data, error } = await supabase
        .from("tenant_members")
        .select("role, tenant_id, tenants ( name, slug )")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile", error);
        setProfile(null);
        return;
      }

      if (data) {
        setProfile({
          role: data.role || "tenant",
          tenant_id: data.tenant_id || null,
          tenant: data.tenants || null,
        });
      } else {
        // usuario sin tenant asociado todavía
        setProfile({
          role: "tenant",
          tenant_id: null,
          tenant: null,
        });
      }
    } catch (e) {
      console.error("Unexpected error loading profile", e);
      setProfile(null);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      return { ok: false, error };
    }

    // El profile se carga automáticamente vía onAuthStateChange
    return { ok: true, session: data.session };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const value = {
    session,
    profile,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
