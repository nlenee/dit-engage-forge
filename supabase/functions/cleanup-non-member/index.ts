import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    if (!token) return new Response(JSON.stringify({ error: "missing token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data: userRes, error: uerr } = await admin.auth.getUser(token);
    if (uerr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const u = userRes.user;
    const email = (u.email || "").toLowerCase();

    // Safety: do NOT delete the org account or any existing approved profile.
    if (email === "divintelteam@gmail.com") {
      return new Response(JSON.stringify({ skipped: "org account" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: prof } = await admin
      .from("profiles")
      .select("user_id")
      .eq("user_id", u.id)
      .maybeSingle();
    if (prof) {
      return new Response(JSON.stringify({ skipped: "profile exists" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Delete the polluting auth user.
    const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ deleted: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});