import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const createClient_SMTP = () => {
  return new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 587,
      tls: true,
      auth: {
        username: Deno.env.get("GMAIL_USER")!,
        password: Deno.env.get("GMAIL_APP_PASSWORD")!,
      },
    },
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    
    if (!gmailUser || !gmailPassword) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invitationId } = await req.json();

    // Get invitation details
    const { data: invitation, error: invError } = await supabase
      .from("admin_invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (invError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invitation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get inviter info
    let inviterName = "DIT Administrator";
    if (invitation.invited_by) {
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", invitation.invited_by)
        .single();
      
      if (inviterProfile?.full_name) {
        inviterName = inviterProfile.full_name;
      }
    }

    // Create acceptance URL - this will redirect to signup with invitation context
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '');
    const acceptUrl = `${appUrl}/auth?invitation=${invitation.token}&email=${encodeURIComponent(invitation.email)}`;

    // Send invitation email using Gmail SMTP
    const client = createClient_SMTP();
    
    await client.send({
      from: gmailUser,
      to: invitation.email,
      subject: "You've Been Invited as an Admin - Divine Intelligence Team",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Admin Invitation</h1>
            <p style="color: #80ced7; margin: 10px 0 0 0;">Divine Intelligence Team</p>
          </div>
          <div style="padding: 30px; background-color: #f8fafc;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hello,</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              You have been invited by <strong>${inviterName}</strong> to become an administrator on the Divine Intelligence Team platform.
            </p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              As an admin, you'll be able to manage users, view all letters, and monitor system activity.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">
              This invitation will expire on ${new Date(invitation.expires_at).toLocaleDateString()}.
            </p>
            <p style="color: #64748b; font-size: 14px;">
              Please click the button above and sign up using this email address: <strong>${invitation.email}</strong>
            </p>
          </div>
        </div>
      `,
    });

    await client.close();

    console.log(`Admin invitation sent to ${invitation.email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-admin-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
