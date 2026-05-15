import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const caller = userData?.user;
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(url, serviceKey);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
    const isAuthorized = (roles ?? []).some((r: { role: string }) => ["admin", "executive_secretary", "chief_executive_director"].includes(r.role));
    if (!isAuthorized) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { requestId, action, notes } = await req.json();
    if (!requestId || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: reqRow, error: reqErr } = await admin.from("password_reset_requests").select("*").eq("id", requestId).maybeSingle();
    if (reqErr || !reqRow) return new Response(JSON.stringify({ error: "Request not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (reqRow.status !== "pending") return new Response(JSON.stringify({ error: "Already reviewed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (action === "reject") {
      await admin.from("password_reset_requests").update({ status: "rejected", reviewed_by: caller.id, reviewed_at: new Date().toISOString(), notes }).eq("id", requestId);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Approve: trigger Supabase recovery email
    const origin = req.headers.get("origin") ?? Deno.env.get("PUBLIC_SITE_URL") ?? "";
    const { error: resetErr } = await admin.auth.resetPasswordForEmail(reqRow.email, {
      redirectTo: `${origin}/reset-password`,
    });
    if (resetErr) {
      return new Response(JSON.stringify({ error: resetErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("password_reset_requests").update({ status: "approved", reviewed_by: caller.id, reviewed_at: new Date().toISOString(), notes }).eq("id", requestId);
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});