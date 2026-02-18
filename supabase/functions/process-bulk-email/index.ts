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

    const { jobId, pdfBase64 } = await req.json();

    // Get job and recipients
    const { data: job, error: jobError } = await supabase
      .from("bulk_email_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: recipients, error: recipientsError } = await supabase
      .from("bulk_email_recipients")
      .select("*")
      .eq("job_id", jobId)
      .eq("status", "pending");

    if (recipientsError) {
      throw recipientsError;
    }

    // Update job status to processing
    await supabase
      .from("bulk_email_jobs")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", jobId);

    // Process emails in background
    (globalThis as any).EdgeRuntime?.waitUntil?.(processEmails(supabase, gmailUser, job, recipients || [], pdfBase64)) 
      || processEmails(supabase, gmailUser, job, recipients || [], pdfBase64);

    return new Response(JSON.stringify({ success: true, message: "Processing started" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in process-bulk-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processEmails(
  supabase: any,
  gmailUser: string,
  job: any,
  recipients: any[],
  pdfBase64: string
) {
  let sentCount = 0;
  let failedCount = 0;
  const client = createClient_SMTP();

  for (const recipient of recipients) {
    try {
      await client.send({
        from: gmailUser,
        to: recipient.recipient_email,
        subject: job.subject,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Divine Intelligence Team</h1>
              <p style="color: #80ced7; margin: 10px 0 0 0;">Letter of Engagement</p>
            </div>
            <div style="padding: 30px; background-color: #f8fafc;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear ${recipient.recipient_name},</p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">${job.message}</p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">Please find your official Letter of Engagement attached.</p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-top: 30px;">Best regards,<br><strong>Divine Intelligence Team</strong></p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `DIT_Letter_of_Engagement_${recipient.recipient_name.replace(/\s+/g, "_")}.pdf`,
            content: pdfBase64,
            encoding: "base64" as const,
            contentType: "application/pdf",
          },
        ],
      });

      const messageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Update recipient status
      await supabase
        .from("bulk_email_recipients")
        .update({ 
          status: "sent", 
          sent_at: new Date().toISOString() 
        })
        .eq("id", recipient.id);

      // Log the email
      await supabase.from("email_logs").insert({
        letter_id: job.letter_id,
        recipient_email: recipient.recipient_email,
        subject: job.subject,
        sent_by: job.created_by,
        status: "sent",
        delivery_status: "sent",
        resend_email_id: messageId,
      });

      sentCount++;
      console.log(`Sent email to ${recipient.recipient_email}`);

      // Update job progress
      await supabase
        .from("bulk_email_jobs")
        .update({ sent_count: sentCount })
        .eq("id", job.id);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      console.error(`Failed to send to ${recipient.recipient_email}:`, error);
      
      await supabase
        .from("bulk_email_recipients")
        .update({ 
          status: "failed", 
          error_message: error.message 
        })
        .eq("id", recipient.id);

      failedCount++;

      await supabase
        .from("bulk_email_jobs")
        .update({ failed_count: failedCount })
        .eq("id", job.id);
    }
  }

  await client.close();

  // Mark job as completed
  await supabase
    .from("bulk_email_jobs")
    .update({ 
      status: failedCount === recipients.length ? "failed" : "completed",
      completed_at: new Date().toISOString(),
      sent_count: sentCount,
      failed_count: failedCount,
    })
    .eq("id", job.id);

  console.log(`Bulk job ${job.id} completed: ${sentCount} sent, ${failedCount} failed`);
}
