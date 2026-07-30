import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (list: unknown): string[] =>
  Array.isArray(list)
    ? Array.from(new Set(list.map((e) => String(e).trim()).filter((e) => EMAIL_RE.test(e))))
    : [];

const smtp = () =>
  new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: Deno.env.get("GMAIL_USER")!,
        password: Deno.env.get("GMAIL_APP_PASSWORD")!,
      },
    },
  });

const wrap = (subject: string, bodyHtml: string) => `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#0a1628 0%,#1a365d 100%);padding:28px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Divine Intelligence Team</h1>
      <p style="color:#c9a227;margin:8px 0 0;font-size:13px;">${subject}</p>
    </div>
    <div style="padding:28px;background:#f8fafc;color:#334155;font-size:15px;line-height:1.7;">
      ${bodyHtml}
      <p style="margin-top:28px;color:#64748b;font-size:13px;">Divine Intelligence Team</p>
    </div>
  </div>`;

async function resolveRecipients(supabase: any, email: any) {
  const rows: any[] = [];
  const seen = new Set<string>();

  const push = (addr: string, name: string | null, field: string, source: string, memberId?: string, factionId?: string) => {
    const key = `${field}:${addr.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      email_id: email.id,
      recipient_email: addr,
      recipient_name: name,
      field,
      source,
      member_user_id: memberId || null,
      faction_id: factionId || null,
    });
  };

  const memberIds: string[] = email.member_ids || [];
  if (memberIds.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, email")
      .in("id", memberIds);
    (data || []).forEach((m: any) => m.email && push(m.email, m.full_name, "to", "member", m.user_id));
  }

  const factionIds: string[] = email.faction_ids || [];
  if (factionIds.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, email, faction_id")
      .in("faction_id", factionIds);
    (data || []).forEach(
      (m: any) => m.email && push(m.email, m.full_name, "to", "faction", m.user_id, m.faction_id),
    );
  }

  clean(email.raw_to_emails).forEach((e) => push(e, null, "to", "raw"));
  clean(email.cc_emails).forEach((e) => push(e, null, "cc", "raw"));
  clean(email.bcc_emails).forEach((e) => push(e, null, "bcc", "raw"));

  return rows;
}

async function deliver(supabase: any, gmailUser: string, email: any) {
  await supabase.from("internal_emails").update({ status: "sending" }).eq("id", email.id);

  // Recipients are resolved at send time so faction membership is never stale.
  await supabase.from("internal_email_recipients").delete().eq("email_id", email.id);
  const rows = await resolveRecipients(supabase, email);
  if (rows.length) await supabase.from("internal_email_recipients").insert(rows);

  const { data: stored } = await supabase
    .from("internal_email_recipients")
    .select("*")
    .eq("email_id", email.id);

  const all = stored || [];
  const cc = all.filter((r: any) => r.field === "cc").map((r: any) => r.recipient_email);
  const bcc = all.filter((r: any) => r.field === "bcc").map((r: any) => r.recipient_email);
  const to = all.filter((r: any) => r.field === "to");

  const client = smtp();
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < to.length; i++) {
    const r = to[i];
    try {
      await client.send({
        from: gmailUser,
        to: r.recipient_email,
        // Cc/Bcc ride along with the first message only.
        ...(i === 0 && cc.length ? { cc } : {}),
        ...(i === 0 && bcc.length ? { bcc } : {}),
        subject: email.subject,
        html: wrap(email.subject, email.body_html),
      });
      sent++;
      await supabase
        .from("internal_email_recipients")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", r.id);
      if (i === 0) {
        await supabase
          .from("internal_email_recipients")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("email_id", email.id)
          .in("field", ["cc", "bcc"]);
      }
    } catch (err: any) {
      failed++;
      console.error("internal email send failed", r.recipient_email, err?.message);
      await supabase
        .from("internal_email_recipients")
        .update({ status: "failed", error_message: String(err?.message || err) })
        .eq("id", r.id);
    }
    await new Promise((res) => setTimeout(res, 120));
  }

  try {
    await client.close();
  } catch (_) { /* ignore */ }

  await supabase
    .from("internal_emails")
    .update({
      status: failed > 0 && sent === 0 ? "failed" : "sent",
      sent_count: sent,
      failed_count: failed,
      recipient_count: all.length,
      sent_at: new Date().toISOString(),
    })
    .eq("id", email.id);

  return { sent, failed, recipientCount: all.length };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const gmailUser = Deno.env.get("GMAIL_USER");
    if (!gmailUser || !Deno.env.get("GMAIL_APP_PASSWORD")) {
      return json({ error: "Email service not configured" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));

    // ---- Cron mode: process due scheduled emails ----
    const cronSecret = Deno.env.get("CRON_SECRET");
    const isCron =
      body?.mode === "process-due" &&
      (!cronSecret || req.headers.get("x-cron-secret") === cronSecret);

    if (body?.mode === "process-due") {
      if (!isCron) return json({ error: "Unauthorized" }, 401);
      const { data: due } = await supabase
        .from("internal_emails")
        .select("*")
        .eq("status", "pending")
        .not("scheduled_at", "is", null)
        .lte("scheduled_at", new Date().toISOString());
      let processed = 0;
      for (const email of due || []) {
        await deliver(supabase, gmailUser, email);
        processed++;
      }
      return json({ success: true, processed });
    }

    // ---- Compose mode: admin / executive secretary only ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const allowed = (roles || []).some(
      (r: any) => r.role === "admin" || r.role === "executive_secretary",
    );
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const subject = String(body.subject || "").trim();
    const bodyHtml = String(body.bodyHtml || "").trim();
    if (!subject || subject.length > 300) return json({ error: "Invalid subject" }, 400);
    if (!bodyHtml) return json({ error: "Message body is required" }, 400);

    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (scheduledAt && isNaN(scheduledAt.getTime())) return json({ error: "Invalid schedule date" }, 400);

    const { data: created, error: insertError } = await supabase
      .from("internal_emails")
      .insert({
        created_by: user.id,
        subject,
        body_html: bodyHtml,
        recipient_modes: Array.isArray(body.modes) ? body.modes.map(String) : [],
        member_ids: Array.isArray(body.memberIds) ? body.memberIds.map(String) : [],
        faction_ids: Array.isArray(body.factionIds) ? body.factionIds.map(String) : [],
        raw_to_emails: clean(body.rawToEmails),
        cc_emails: clean(body.ccEmails),
        bcc_emails: clean(body.bccEmails),
        scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
        timezone: body.timezone || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    if (scheduledAt && scheduledAt.getTime() > Date.now()) {
      const rows = await resolveRecipients(supabase, created);
      if (rows.length) await supabase.from("internal_email_recipients").insert(rows);
      await supabase
        .from("internal_emails")
        .update({ recipient_count: rows.length })
        .eq("id", created.id);
      return json({ success: true, scheduled: true, recipientCount: rows.length, id: created.id });
    }

    const result = await deliver(supabase, gmailUser, created);
    return json({ success: true, scheduled: false, ...result, id: created.id });
  } catch (error: any) {
    console.error("send-internal-email error:", error);
    return json({ error: error?.message || "Unexpected error" }, 500);
  }
});