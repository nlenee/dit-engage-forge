import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_PASS = Deno.env.get("GMAIL_APP_PASSWORD");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const messageId = typeof body?.message_id === "string" ? body.message_id : "";
    if (!messageId) return json({ error: "message_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: msg, error: msgErr } = await admin
      .from("messages")
      .select("id, sender_id, recipient_id, subject, body")
      .eq("id", messageId)
      .single();
    if (msgErr || !msg) return json({ error: "Message not found" }, 404);
    if (msg.sender_id !== user.id) return json({ error: "Forbidden" }, 403);

    const { data: people } = await admin
      .from("profiles")
      .select("user_id, full_name, email, executive_role, custom_role_title, faction")
      .in("user_id", [msg.sender_id, msg.recipient_id]);

    const sender = (people || []).find((p: any) => p.user_id === msg.sender_id);
    const recipient = (people || []).find((p: any) => p.user_id === msg.recipient_id);
    if (!recipient?.email) return json({ error: "Recipient has no email on file" }, 422);

    const senderName = sender?.full_name || "A DIT member";
    const senderRole = sender?.executive_role || sender?.custom_role_title || "Member";
    const appUrl = (Deno.env.get("FRONTEND_URL") || "https://dit-engage-forge.lovable.app") + "/messages";

    if (!GMAIL_USER || !GMAIL_PASS) {
      return json({ ok: false, emailed: false, reason: "Mail not configured" });
    }

    const smtp = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: { username: GMAIL_USER, password: GMAIL_PASS },
      },
    });

    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#0a1628 0%,#1a365d 100%);padding:28px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Divine Intelligence Team</h1>
          <p style="color:#c9a227;margin:8px 0 0;font-size:13px;">New platform message</p>
        </div>
        <div style="padding:28px;background:#f8fafc;color:#334155;font-size:15px;line-height:1.7;">
          <p>Hello ${escape(recipient.full_name || "there")},</p>
          <p><strong>You have a message from ${escape(senderName)}, ${escape(senderRole)} — check it up now.</strong></p>
          <p style="background:#fff;border-left:3px solid #c9a227;padding:12px 16px;margin:18px 0;">
            <strong>${escape(msg.subject || "(no subject)")}</strong>
          </p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${appUrl}" style="background:#1a365d;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;">Open my messages</a>
          </p>
          <p style="color:#64748b;font-size:13px;">Divine Intelligence Team</p>
        </div>
      </div>`;

    await smtp.send({
      from: `Divine Intelligence Team <${GMAIL_USER}>`,
      to: recipient.email,
      subject: `New message from ${senderName} (${senderRole})`,
      html,
      content: `You have a message from ${senderName}, ${senderRole} — check it up now: ${appUrl}`,
    });
    await smtp.close();

    return json({ ok: true, emailed: true });
  } catch (e) {
    console.error("send-message-notification error", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
