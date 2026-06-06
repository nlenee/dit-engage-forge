import { supabase } from "@/integrations/supabase/client";

/**
 * Guard before authenticated API calls. Returns the current session or
 * throws a descriptive error so callers can surface the right toast and
 * redirect to /auth.
 */
export async function ensureSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error("No active session — please sign in again.");
  }
  return data.session;
}