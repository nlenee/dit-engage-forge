import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  letterId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  pdfBase64: string;
}

const createClient_SMTP = () => {
  return new SMTPClient({
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
        JSON.stringify({ error: "Email service not configured. Please set up Gmail credentials." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { letterId, recipientEmail, recipientName, subject, message, pdfBase64 }: EmailRequest = await req.json();

    if (!recipientEmail || !subject || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email using Gmail SMTP
    const client = createClient_SMTP();
    
    await client.send({
      from: gmailUser,
      to: recipientEmail,
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Divine Intelligence Team</h1>
            <p style="color: #80ced7; margin: 10px 0 0 0;">Letter of Engagement</p>
          </div>
          <div style="padding: 30px; background-color: #f8fafc;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear ${recipientName},</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">${message}</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">Please find your official Letter of Engagement attached.</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-top: 30px;">Best regards,<br><strong>Divine Intelligence Team</strong></p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `DIT_Letter_of_Engagement_${recipientName.replace(/\s+/g, "_")}.pdf`,
          content: pdfBase64,
          encoding: "base64",
          contentType: "application/pdf",
        },
      ],
    });

    await client.close();
    
    const messageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Log the email in the database
    if (letterId) {
      await supabase.from("email_logs").insert({
        letter_id: letterId,
        recipient_email: recipientEmail,
        subject: subject,
        sent_by: user.id,
        status: "sent",
        delivery_status: "sent",
        resend_email_id: messageId,
      });

      await supabase.from("letters").update({ status: "sent" }).eq("id", letterId);
    }

    return new Response(JSON.stringify({ success: true, messageId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-letter-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
