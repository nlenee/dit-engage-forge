import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VERIFICATION_EMAILS = [
  "nleneeletura@gmail.com",
  "divintelteam@gmail.com"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { sealId } = await req.json();

    // Get seal details
    const { data: seal, error: sealError } = await supabase
      .from("digital_seals")
      .select("*, letters(*)")
      .eq("id", sealId)
      .single();

    if (sealError || !seal) {
      return new Response(
        JSON.stringify({ error: "Seal not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get requester info
    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", seal.requested_by)
      .single();

    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.supabase.co') || '';
    const approveUrl = `${baseUrl}/functions/v1/handle-seal-action?token=${seal.approval_token}&action=approve`;
    const rejectUrl = `${baseUrl}/functions/v1/handle-seal-action?token=${seal.approval_token}&action=reject`;

    // Send verification emails to each approver
    for (const email of VERIFICATION_EMAILS) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "DIT Seal Verification <onboarding@resend.dev>",
          to: [email],
          subject: "Digital Seal Verification Required",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Digital Seal Verification</h1>
                <p style="color: #80ced7; margin: 10px 0 0 0;">Divine Intelligence Team</p>
              </div>
              <div style="padding: 30px; background-color: #f8fafc;">
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear Approver,</p>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                  A digital seal has been requested for a Letter of Engagement. Please review the details below and take action.
                </p>
                
                <div style="background: #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>Document:</strong> Letter of Engagement</p>
                  <p style="margin: 0 0 10px 0;"><strong>Recipient:</strong> ${seal.letters?.recipient_name || 'N/A'}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Requested By:</strong> ${requesterProfile?.full_name || 'Unknown'}</p>
                  <p style="margin: 0;"><strong>Purpose:</strong> ${seal.purpose}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${approveUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-right: 10px; font-weight: bold;">
                    ✓ Approve Seal
                  </a>
                  <a href="${rejectUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                    ✗ Reject Seal
                  </a>
                </div>
                
                <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                  This verification email was sent to ensure the authenticity and proper use of the DIT digital seal.
                </p>
              </div>
            </div>
          `,
        }),
      });
    }

    // Mark verification emails as sent
    await supabase
      .from("digital_seals")
      .update({ verification_emails_sent: true })
      .eq("id", sealId);

    console.log(`Verification emails sent for seal ${sealId}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-seal-verification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
