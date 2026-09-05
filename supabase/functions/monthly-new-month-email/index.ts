import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const html = (title: string, msg: string) =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
     <body style="font-family:'Segoe UI',Arial,sans-serif;background:#0a1628;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;">
       <div style="max-width:520px;padding:40px;text-align:center;">
         <h1 style="color:#c9a84c;margin:0 0 12px;">${title}</h1>
         <p style="color:#cbd5e1;line-height:1.7;">${msg}</p>
       </div>
     </body></html>`,
    { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );

const APPROVER_EMAIL = Deno.env.get("MONTHLY_APPROVER_EMAIL") || "divintelteam@gmail.com";
const FRONTEND = Deno.env.get("FRONTEND_URL") || "https://dit-engage-forge.lovable.app";

const smtp = () =>
  new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: Deno.env.get("GMAIL_USER")!, password: Deno.env.get("GMAIL_APP_PASSWORD")! },
    },
  });

const shell = (subject: string, body: string) => `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#0a1628 0%,#1a365d 100%);padding:28px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Divine Intelligence Team</h1>
      <p style="color:#c9a84c;margin:8px 0 0;font-size:13px;">${subject}</p>
    </div>
    <div style="padding:28px;background:#f8fafc;color:#334155;font-size:15px;line-height:1.75;">
      ${body}
      <p style="margin-top:28px;color:#64748b;font-size:13px;">Divine Intelligence Team</p>
    </div>
  </div>`;

async function compose(monthName: string, year: number) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  const fallback = `<p>Happy New Month, Divine Intelligence Team!</p>
    <p>Welcome to ${monthName} ${year}. May this month bring you clarity, strength, and progress in everything you set your hands to.</p>
    <p>Let's keep showing up for one another, serving with excellence, and building something that outlives us.</p>
    <p><strong>Happy new month!</strong></p>`;
  if (!key) return { subject: `Happy New Month — ${monthName} ${year}`, body: fallback };

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You write warm, uplifting monthly messages for members of the Divine Intelligence Team (DIT), a faith-inspired community and leadership organisation. Return simple HTML paragraphs only (<p>, <strong>, <em>) — no headings, no links, no markdown, no <html> wrapper. 130-200 words.",
          },
          {
            role: "user",
            content: `Write the "Happy New Month" message for ${monthName} ${year}. Greet the members, reflect briefly on the new month, encourage growth, service and unity, and close with a happy new month blessing.`,
          },
        ],
      }),
    });
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return { subject: `Happy New Month — ${monthName} ${year}`, body: fallback };
    const body = text.includes("<p") ? text : text.split(/\n{2,}/).map((p: string) => `<p>${p.trim()}</p>`).join("");
    return { subject: `Happy New Month — ${monthName} ${year}`, body };
  } catch (_) {
    return { subject: `Happy New Month — ${monthName} ${year}`, body: fallback };
  }
}

async function broadcast(admin: any, record: any) {
  const { data: members } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("profile_completed", true)
    .not("email", "is", null);

  const list = Array.from(
    new Map((members || []).filter((m: any) => m.email).map((m: any) => [String(m.email).toLowerCase(), m])).values(),
  ) as any[];

  const client = smtp();
  let sent = 0;
  let failed = 0;
  for (const m of list) {
    try {
      const greeting = m.full_name ? `<p>Dear ${m.full_name},</p>` : "";
      await client.send({
        from: Deno.env.get("GMAIL_USER")!,
        to: m.email,
        subject: record.subject,
        html: shell(record.subject, greeting + record.body_html),
      });
      sent++;
    } catch (e) {
      failed++;
      console.error("monthly email failed", m.email, (e as any)?.message);
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  try { await client.close(); } catch (_) { /* ignore */ }

  await admin
    .from("monthly_messages")
    .update({
      status: failed > 0 && sent === 0 ? "failed" : "sent",
      sent_at: new Date().toISOString(),
      recipient_count: list.length,
      sent_count: sent,
      failed_count: failed,
    })
    .eq("id", record.id);

  return { sent, failed, recipients: list.length };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const url = new URL(req.url);

  try {
    // ---- Approve / reject via emailed link (token authenticated) ----
    const action = url.searchParams.get("action");
    const token = url.searchParams.get("token");
    if (action && token) {
      const { data: record } = await admin
        .from("monthly_messages")
        .select("*")
        .eq("approval_token", token)
        .maybeSingle();
      if (!record) return html("Link not valid", "This approval link is no longer valid.");
      if (record.status === "sent") return html("Already sent", "This month's message has already gone out to members.");

      if (action === "reject") {
        await admin
          .from("monthly_messages")
          .update({ status: "rejected", rejected_at: new Date().toISOString() })
          .eq("id", record.id);
        return html("Message declined", "This month's message will not be sent. You can compose a replacement from the admin dashboard.");
      }

      if (action === "approve") {
        await admin
          .from("monthly_messages")
          .update({ status: "approved", approved_at: new Date().toISOString() })
          .eq("id", record.id);
        const result = await broadcast(admin, record);
        return html(
          "Approved and sent",
          `The ${record.subject} message has been delivered to ${result.sent} member(s).${result.failed ? ` ${result.failed} could not be delivered.` : ""}`,
        );
      }
      return html("Unknown action", "Nothing to do.");
    }

    const body = await req.json().catch(() => ({} as any));
    const mode = body?.mode || "generate";

    if (mode === "generate") {
      const cronSecret = Deno.env.get("CRON_SECRET");
      const viaCron = !cronSecret || req.headers.get("x-cron-secret") === cronSecret;
      let authorised = viaCron;
      if (!authorised) {
        const authHeader = req.headers.get("Authorization");
        if (authHeader) {
          const { data: { user } } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
          if (user) {
            const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
            authorised = (roles || []).some((r: any) =>
              ["admin", "chief_executive_director", "executive_secretary"].includes(r.role));
          }
        }
      }
      if (!authorised) return json({ error: "Unauthorized" }, 401);

      const now = new Date();
      const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
      const monthName = now.toLocaleString("en-US", { month: "long", timeZone: "UTC" });

      const { data: existing } = await admin
        .from("monthly_messages")
        .select("*")
        .eq("month_key", monthKey)
        .maybeSingle();
      if (existing && !body?.force) {
        return json({ success: true, alreadyExists: true, status: existing.status, id: existing.id });
      }

      const { subject, body: bodyHtml } = await compose(monthName, now.getUTCFullYear());

      const { data: record, error } = existing
        ? await admin
            .from("monthly_messages")
            .update({ subject, body_html: bodyHtml, status: "pending_approval", approved_at: null, rejected_at: null })
            .eq("id", existing.id)
            .select()
            .single()
        : await admin
            .from("monthly_messages")
            .insert({ month_key: monthKey, subject, body_html: bodyHtml })
            .select()
            .single();
      if (error) throw error;

      // Send the draft to the approver
      if (!Deno.env.get("GMAIL_USER") || !Deno.env.get("GMAIL_APP_PASSWORD")) {
        return json({ error: "Email service not configured" }, 500);
      }
      const base = `${Deno.env.get("SUPABASE_URL")}/functions/v1/monthly-new-month-email`;
      const approveUrl = `${base}?action=approve&token=${record.approval_token}`;
      const rejectUrl = `${base}?action=reject&token=${record.approval_token}`;

      const client = smtp();
      await client.send({
        from: Deno.env.get("GMAIL_USER")!,
        to: APPROVER_EMAIL,
        subject: `Approval needed — ${subject}`,
        html: shell(
          `Approval needed — ${subject}`,
          `<p>The monthly message for <strong>${monthName} ${now.getUTCFullYear()}</strong> is ready. Review it below. Approving sends it to every member immediately.</p>
           <div style="border:1px solid #e2e8f0;border-radius:10px;padding:18px;background:#fff;margin:18px 0;">${bodyHtml}</div>
           <div style="text-align:center;margin:26px 0;">
             <a href="${approveUrl}" style="display:inline-block;background:#1a365d;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:10px;">Approve &amp; Send</a>
             <a href="${rejectUrl}" style="display:inline-block;background:#e2e8f0;color:#334155;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Decline</a>
           </div>
           <p style="font-size:13px;color:#64748b;">You can also review it in the admin dashboard: ${FRONTEND}/admin</p>`,
        ),
      });
      try { await client.close(); } catch (_) { /* ignore */ }

      return json({ success: true, id: record.id, status: "pending_approval", approver: APPROVER_EMAIL });
    }

    if (mode === "send-approved") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Unauthorized" }, 401);
      const { data: { user } } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
      if (!user) return json({ error: "Unauthorized" }, 401);
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
      const allowed = (roles || []).some((r: any) =>
        ["admin", "chief_executive_director", "executive_secretary"].includes(r.role));
      if (!allowed) return json({ error: "Forbidden" }, 403);

      const { data: record } = await admin.from("monthly_messages").select("*").eq("id", body.id).maybeSingle();
      if (!record) return json({ error: "Message not found" }, 404);
      if (record.status === "sent") return json({ error: "Already sent" }, 400);
      await admin
        .from("monthly_messages")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", record.id);
      const result = await broadcast(admin, record);
      return json({ success: true, ...result });
    }

    return json({ error: "Unknown mode" }, 400);
  } catch (e: any) {
    console.error("monthly-new-month-email error", e);
    return json({ error: e?.message || String(e) }, 500);
  }
});
