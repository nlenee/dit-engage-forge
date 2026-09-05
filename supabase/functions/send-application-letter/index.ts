import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const FRONTEND = Deno.env.get("FRONTEND_URL") || "https://dit-engage-forge.lovable.app";

const letterShell = (title: string, body: string) => `
  <div style="font-family:Garamond,Georgia,serif;max-width:660px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#0a1628 0%,#1a365d 100%);padding:30px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-family:'Segoe UI',Arial,sans-serif;">Divine Intelligence Team</h1>
      <p style="color:#c9a84c;margin:8px 0 0;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">${title}</p>
    </div>
    <div style="padding:34px;color:#1f2937;font-size:16px;line-height:1.8;">
      ${body}
      <p style="margin-top:34px;">Yours faithfully,<br/><strong>Office of the Executive Secretary</strong><br/>Divine Intelligence Team</p>
    </div>
  </div>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_PASS = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!GMAIL_USER || !GMAIL_PASS) return json({ error: "Email service not configured" }, 500);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const { data: { user } } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const [{ data: roles }, { data: perms }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", user.id),
      admin.rpc("user_permissions", { _user_id: user.id }),
    ]);
    const permList: string[] = (perms as string[]) || [];
    const allowed =
      (roles || []).some((r: any) =>
        ["admin", "chief_executive_director", "executive_secretary", "community_manager",
         "executive_director", "executive_assistant"].includes(r.role)) ||
      permList.includes("*") || permList.includes("applications.review") || permList.includes("letters.create");
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const { application_id, kind, faction, message, subject: customSubject } = await req.json();
    if (!application_id) return json({ error: "application_id required" }, 400);
    const type = kind === "transfer" ? "transfer" : kind === "rejection" ? "rejection" : "offer";

    const { data: app } = await admin.from("applications").select("*").eq("id", application_id).single();
    if (!app) return json({ error: "Application not found" }, 404);

    const targetFaction = faction || app.final_faction || app.selected_faction || app.ai_suggested_faction;
    const name = app.applicant_name;
    const ref = app.reference_number;

    let title = "Official Correspondence";
    let bodyHtml = "";

    if (type === "transfer") {
      title = "Notice of Faction Transfer";
      bodyHtml = `
        <p>Dear ${name},</p>
        <p>Following a review of your application <strong>${ref}</strong>, the review panel has transferred your placement to the
        <strong>${targetFaction || "assigned"}</strong> faction, where we believe your gifts will be best expressed.</p>
        ${message ? `<p>${message}</p>` : ""}
        <p>Your application remains active and no further action is required from you at this stage. You may follow its progress at
        <a href="${FRONTEND}/track">${FRONTEND}/track</a>.</p>`;
    } else if (type === "rejection") {
      title = "Application Outcome";
      bodyHtml = `
        <p>Dear ${name},</p>
        <p>Thank you for your interest in the Divine Intelligence Team and for the time invested in application <strong>${ref}</strong>.</p>
        <p>After careful review, we are unable to proceed with your application at this time.</p>
        ${message ? `<p>${message}</p>` : ""}
        <p>We genuinely wish you every success, and we welcome a future application.</p>`;
    } else {
      title = "Letter of Admission";
      bodyHtml = `
        <p>Dear ${name},</p>
        <p>On behalf of the Board of Executives, it is my pleasure to formally admit you into the Divine Intelligence Team
        under application reference <strong>${ref}</strong>.</p>
        <p>You have been placed in the <strong>${targetFaction || "DIT"}</strong> faction. This admission carries with it the
        expectation of service, integrity and active participation in the life of the community.</p>
        ${message ? `<p>${message}</p>` : ""}
        <p>Please complete your onboarding at <a href="${FRONTEND}/auth">${FRONTEND}/auth</a> using this email address.</p>
        <p>Welcome home.</p>`;
    }

    const subject = customSubject || `${title} — ${ref}`;

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com", port: 465, tls: true,
        auth: { username: GMAIL_USER, password: GMAIL_PASS },
      },
    });
    await client.send({
      from: GMAIL_USER,
      to: app.applicant_email,
      subject,
      html: letterShell(title, bodyHtml),
    });
    try { await client.close(); } catch (_) { /* ignore */ }

    await admin.from("notifications_log").insert({
      application_id,
      recipient_email: app.applicant_email,
      notification_type: type === "offer" ? "decision" : "status_update",
      subject,
      body: bodyHtml,
      delivery_status: "sent",
    });

    return json({ success: true, subject });
  } catch (e: any) {
    console.error("send-application-letter error", e);
    return json({ error: e?.message || String(e) }, 500);
  }
});
