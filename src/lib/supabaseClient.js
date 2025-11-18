import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Te ayuda a detectar si falta algo en .env
  // eslint-disable-next-line no-console
  console.warn("Supabase URL or anon key is not set in environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
