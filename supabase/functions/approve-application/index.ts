import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const allowed = (roles || []).some((r: any) =>
      ["admin", "chief_executive_director", "executive_secretary", "community_manager",
       "executive_director", "executive_assistant"].includes(r.role)
    );
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const { application_id, faction_override, role_title } = await req.json();
    if (!application_id) return json({ error: "application_id required" }, 400);

    const { data: app, error: appErr } = await admin
      .from("applications").select("*").eq("id", application_id).single();
    if (appErr || !app) return json({ error: "Application not found" }, 404);

    const finalFaction = faction_override || app.selected_faction || app.ai_suggested_faction || app.final_faction;
    const email = String(app.applicant_email).toLowerCase().trim();
    const fullName = app.applicant_name;

    // 1. Update application -> approved
    await admin.from("applications").update({
      status: "approved",
      final_faction: finalFaction,
    }).eq("id", application_id);

    await admin.from("application_reviews").insert({
      application_id, reviewer_id: user.id, action: "approved",
      comment: "Auto-provisioned member account.",
    });

    // 2. Check if user already exists in auth
    let targetUserId: string | null = null;
    const { data: existingProfile } = await admin
      .from("profiles").select("user_id").ilike("email", email).maybeSingle();

    if (existingProfile?.user_id) {
      targetUserId = existingProfile.user_id;
      // Patch faction/role on existing profile
      await admin.from("profiles").update({
        faction: finalFaction,
        custom_role_title: role_title || "Member",
        pending_role_assignment: false,
      }).eq("user_id", targetUserId);
    } else {
      // 3. Invite the user (creates auth.users row -> handle_new_user creates profile)
      const redirectTo = (Deno.env.get("FRONTEND_URL") || "https://dit-engage-forge.lovable.app") + "/auth";
      const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          faction: finalFaction,
          pending_role_assignment: false,
          profile_completed: false,
        },
        redirectTo,
      });
      if (invErr) {
        console.error("Invite error:", invErr);
        return json({ error: `Invite failed: ${invErr.message}` }, 500);
      }
      targetUserId = invited.user?.id || null;

      // Patch profile with custom role title after trigger runs
      if (targetUserId) {
        await admin.from("profiles").update({
          custom_role_title: role_title || "Member",
          faction: finalFaction,
        }).eq("user_id", targetUserId);
      }
    }

    // 4. Welcome email (Gmail SMTP) — Google Sign-In friendly
    if (GMAIL_USER && GMAIL_PASS) {
      try {
        const smtp = new SMTPClient({
          connection: {
            hostname: "smtp.gmail.com", port: 465, tls: true,
            auth: { username: GMAIL_USER, password: GMAIL_PASS },
          },
        });
        const signInUrl = (Deno.env.get("FRONTEND_URL") || "https://dit-engage-forge.lovable.app") + "/auth";
        await smtp.send({
          from: GMAIL_USER,
          to: email,
          subject: "Welcome to DIT — Your Membership Is Approved",
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:linear-gradient(135deg,#0a1628 0%,#1a365d 100%);padding:30px;text-align:center;">
                <h1 style="color:#fff;margin:0;">Welcome, ${fullName}</h1>
                <p style="color:#c9a84c;margin:8px 0 0;">Divine Intelligence Team</p>
              </div>
              <div style="padding:30px;background:#f8fafc;color:#334155;font-size:15px;line-height:1.6;">
                <p>Congratulations — your application <strong>${app.reference_number}</strong> has been approved.</p>
                <p>You have been placed in the <strong>${finalFaction || "DIT"}</strong> faction as a <strong>${role_title || "Member"}</strong>.</p>
                <p>Sign in with the email <strong>${email}</strong>. You can use <strong>Google Sign-In</strong> with this same address, or set a password from the invitation link sent separately.</p>
                <div style="text-align:center;margin:30px 0;">
                  <a href="${signInUrl}" style="display:inline-block;background:#1a365d;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Sign In to DIT</a>
                </div>
                <p style="color:#64748b;font-size:13px;">If you did not apply, please ignore this email.</p>
              </div>
            </div>`,
        });
        await smtp.close();
      } catch (e) {
        console.error("Welcome email failed:", e);
      }
    }

    // 5. Notification log
    await admin.from("notifications_log").insert({
      application_id, recipient_email: email,
      notification_type: "approval", subject: "Welcome to DIT",
      body: `Approved into ${finalFaction || "DIT"} as ${role_title || "Member"}.`,
      delivery_status: "sent",
    });

    return json({ success: true, user_id: targetUserId, faction: finalFaction });
  } catch (e: any) {
    console.error("approve-application error:", e);
    return json({ error: e.message || String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}