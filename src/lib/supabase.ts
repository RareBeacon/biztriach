export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { url, anonKey, serviceKey, isConfigured: !!(url && (anonKey || serviceKey)) };
}

export async function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;
  try {
    const module = await import("@supabase/supabase-js");
    const key = config.serviceKey || config.anonKey;
    return module.createClient(config.url, key);
  } catch (e) {
    console.warn("[Supabase] not installed");
    return null;
  }
}

export async function logToSupabase(table: string, data: any) {
  try {
    const client = await getSupabaseClient();
    if (!client) return;
    await (client as any).from(table).insert(data);
  } catch (e) {
    console.warn(`[Supabase] Failed to log to ${table}`);
  }
}
