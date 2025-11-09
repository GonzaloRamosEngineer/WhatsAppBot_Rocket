// Mock de Supabase Client para desarrollo sin backend
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async ({ email, password }) => {
      if (email === "tenant@business.com" && password === "tenant123") {
        return { data: { session: { user: { id: "u-tenant", email } } }, error: null };
      }
      if (email === "admin@whatsappbot.com" && password === "admin123") {
        return { data: { session: { user: { id: "u-admin", email } } }, error: null };
      }
      return { data: null, error: { message: "Credenciales inválidas" } };
    },
    signUp: async ({ email }) => ({ data: { user: { id: "new", email } }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (table) => ({
    select: async () => ({ data: [], error: null }),
  }),
};
