import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
}

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

    // Get the authorization header to identify the inviter
    const authHeader = req.headers.get("Authorization");
    let invitedBy = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      invitedBy = user?.id;
    }

    const { email }: InvitationRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from("member_invitations")
      .select("*")
      .eq("email", email)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .single();

    let invitation;

    if (existingInvitation) {
      invitation = existingInvitation;
    } else {
      // Create new invitation
      const { data, error } = await supabase
        .from("member_invitations")
        .insert({
          email,
          invited_by: invitedBy,
        })
        .select()
        .single();

      if (error) throw error;
      invitation = data;
    }

    // Get frontend URL from environment or construct it
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://dit-engage-forge.lovable.app";
    const registrationUrl = `${frontendUrl}/register?token=${invitation.token}`;

    // Send invitation email using Gmail SMTP
    const client = createClient_SMTP();
    
    await client.send({
      from: gmailUser,
      to: email,
      subject: "You're Invited to Join Divine Intelligence Team",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to DIT</h1>
            <p style="color: #80ced7; margin: 10px 0 0 0;">Divine Intelligence Team</p>
          </div>
          <div style="padding: 30px; background-color: #f8fafc;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hello,</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              You have been invited to join the Divine Intelligence Team as a member. 
              Click the button below to complete your registration.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationUrl}" style="display: inline-block; background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Complete Registration
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
              This invitation link will expire in 30 days.
            </p>
            
            <p style="color: #64748b; font-size: 12px; margin-top: 30px;">
              If you did not expect this invitation, please ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    await client.close();

    console.log(`Member invitation sent to ${email}, token: ${invitation.token}`);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-member-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
