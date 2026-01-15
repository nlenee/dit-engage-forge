import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  memberId?: string;
}

interface VerifyOTPRequest {
  email: string;
  code: string;
  memberId: string;
}

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

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "send";

    if (action === "send") {
      const { email, memberId }: SendOTPRequest = await req.json();

      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in members table if memberId provided, otherwise in a temp location
      if (memberId) {
        await supabase
          .from("members")
          .update({
            email_verification_code: otp,
            verification_code_expires_at: expiresAt.toISOString(),
          })
          .eq("id", memberId);
      }

      // Send OTP email
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "DIT Verification <onboarding@resend.dev>",
          to: [email],
          subject: "Your DIT Email Verification Code",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Email Verification</h1>
                <p style="color: #80ced7; margin: 10px 0 0 0;">Divine Intelligence Team</p>
              </div>
              <div style="padding: 30px; background-color: #f8fafc; text-align: center;">
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                  Your verification code is:
                </p>
                
                <div style="background: #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #0a1628; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h2>
                </div>
                
                <p style="color: #64748b; font-size: 14px;">
                  This code will expire in 10 minutes.
                </p>
              </div>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error("Failed to send verification email");
      }

      console.log(`OTP sent to ${email}`);

      return new Response(
        JSON.stringify({ success: true, otp: memberId ? undefined : otp }), // Only return OTP for temp storage during registration
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "verify") {
      const { email, code, memberId }: VerifyOTPRequest = await req.json();

      if (!email || !code || !memberId) {
        return new Response(
          JSON.stringify({ error: "Email, code, and memberId are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify OTP
      const { data: member, error } = await supabase
        .from("members")
        .select("email_verification_code, verification_code_expires_at")
        .eq("id", memberId)
        .eq("email", email)
        .single();

      if (error || !member) {
        return new Response(
          JSON.stringify({ error: "Member not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (member.email_verification_code !== code) {
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new Date(member.verification_code_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Verification code has expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark email as verified
      await supabase
        .from("members")
        .update({
          email_verified: true,
          email_verification_code: null,
          verification_code_expires_at: null,
        })
        .eq("id", memberId);

      console.log(`Email verified for member ${memberId}`);

      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-member-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
