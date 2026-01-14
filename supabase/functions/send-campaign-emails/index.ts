import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  name: string;
  email: string;
}

interface CampaignRequest {
  subject: string;
  content: string;
  recipients: Recipient[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { subject, content, recipients }: CampaignRequest = await req.json();

    if (!subject || !content || !recipients || recipients.length === 0) {
      throw new Error("Missing required fields: subject, content, or recipients");
    }

    console.log(`Starting campaign: ${subject} to ${recipients.length} recipients`);

    let sentCount = 0;
    let failedCount = 0;

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }

    for (const recipient of recipients) {
      try {
        // Personalize content
        const personalizedContent = content
          .replace(/\{\{name\}\}/g, recipient.name.split(" ")[0])
          .replace(/\{\{fullname\}\}/g, recipient.name)
          .replace(/\{\{month\}\}/g, new Date().toLocaleString("default", { month: "long" }))
          .replace(/\{\{year\}\}/g, String(new Date().getFullYear()));

        const personalizedSubject = subject
          .replace(/\{\{name\}\}/g, recipient.name.split(" ")[0])
          .replace(/\{\{month\}\}/g, new Date().toLocaleString("default", { month: "long" }));

        // Convert plain text to HTML
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">DIT</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
              ${personalizedContent.split("\n").map((line) => `<p style="margin: 0 0 15px 0; line-height: 1.6;">${line}</p>`).join("")}
            </div>
            <div style="background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
              <p style="margin: 0;">© DIT ${new Date().getFullYear()}</p>
            </div>
          </div>
        `;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "DIT <onboarding@resend.dev>",
            to: [recipient.email],
            subject: personalizedSubject,
            html: htmlContent,
          }),
        });

        const resData = await res.json();

        if (res.ok && resData.id) {
          sentCount++;
          
          // Log the email
          await supabaseClient.from("email_logs").insert({
            recipient_email: recipient.email,
            subject: personalizedSubject,
            sent_by: userId,
            status: "sent",
            delivery_status: "sent",
            resend_email_id: resData.id,
          });
        } else {
          failedCount++;
          console.error(`Failed to send to ${recipient.email}:`, resData);
        }
      } catch (error) {
        failedCount++;
        console.error(`Error sending to ${recipient.email}:`, error);
      }
    }

    console.log(`Campaign complete: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentCount, 
        failedCount,
        message: `Sent ${sentCount} emails, ${failedCount} failed`
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Campaign error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
