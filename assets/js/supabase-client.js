import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm";

let client;
export function getSupabase() {
  const config = window.JEREMINERALOGIE_SUPABASE;
  if (!config || !config.url || !config.publishableKey ||
      config.url.includes("PLACEHOLDER") || config.publishableKey.includes("PLACEHOLDER")) return null;
  if (!client) {
    client = createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      global: {
        fetch: (input, init = {}) => fetch(input, { ...init, cache: "no-store" })
      }
    });
  }
  return client;
}
