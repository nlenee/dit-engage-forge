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
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all pending scheduled emails that are due
    const now = new Date().toISOString();
    const { data: dueEmails, error: queryError } = await supabase
      .from("scheduled_emails")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", now);

    if (queryError) {
      throw queryError;
    }

    if (!dueEmails || dueEmails.length === 0) {
      return new Response(JSON.stringify({ message: "No emails to process" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${dueEmails.length} scheduled emails`);

    let processed = 0;
    let failed = 0;
    const client = createClient_SMTP();

    for (const email of dueEmails) {
      try {
        // Mark as processing
        await supabase
          .from("scheduled_emails")
          .update({ status: "processing" })
          .eq("id", email.id);

        // Prepare attachments
        const attachments = email.pdf_base64 ? [
          {
            filename: `DIT_Letter_of_Engagement_${email.recipient_name.replace(/\s+/g, "_")}.pdf`,
            content: email.pdf_base64,
            encoding: "base64" as const,
            contentType: "application/pdf",
          },
        ] : [];

        // Send the email using Gmail SMTP
        await client.send({
          from: gmailUser,
          to: email.recipient_email,
          subject: email.subject,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Divine Intelligence Team</h1>
                <p style="color: #80ced7; margin: 10px 0 0 0;">Letter of Engagement</p>
              </div>
              <div style="padding: 30px; background-color: #f8fafc;">
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear ${email.recipient_name},</p>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">${email.message}</p>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">Please find your official Letter of Engagement attached.</p>
                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-top: 30px;">Best regards,<br><strong>Divine Intelligence Team</strong></p>
              </div>
            </div>
          `,
          attachments,
        });

        const messageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Update scheduled email status
        await supabase
          .from("scheduled_emails")
          .update({ 
            status: "sent", 
            sent_at: new Date().toISOString() 
          })
          .eq("id", email.id);

        // Log the email
        if (email.letter_id) {
          await supabase.from("email_logs").insert({
            letter_id: email.letter_id,
            recipient_email: email.recipient_email,
            subject: email.subject,
            sent_by: email.created_by,
            status: "sent",
            delivery_status: "sent",
            resend_email_id: messageId,
          });

          await supabase.from("letters").update({ status: "sent" }).eq("id", email.letter_id);
        }

        processed++;
        console.log(`Sent scheduled email to ${email.recipient_email}`);

      } catch (error: any) {
        console.error(`Failed to send scheduled email ${email.id}:`, error);
        
        await supabase
          .from("scheduled_emails")
          .update({ 
            status: "failed", 
            error_message: error.message 
          })
          .eq("id", email.id);

        failed++;
      }
    }

    await client.close();

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed, 
        failed,
        total: dueEmails.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in process-scheduled-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
