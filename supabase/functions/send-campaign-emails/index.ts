import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Require authenticated admin/CM/ES caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { data: roles } = await supabaseClient
      .from("user_roles").select("role").eq("user_id", user.id);
    const allowed = (roles || []).some((r: any) =>
      ["admin", "executive_secretary", "community_manager"].includes(r.role)
    );
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const userId: string = user.id;

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    
    if (!gmailUser || !gmailPassword) {
      throw new Error("Gmail credentials are not configured");
    }

    const { subject, content, recipients }: CampaignRequest = await req.json();

    if (!subject || !content || !recipients || recipients.length === 0) {
      throw new Error("Missing required fields: subject, content, or recipients");
    }

    console.log(`Starting campaign: ${subject} to ${recipients.length} recipients`);

    let sentCount = 0;
    let failedCount = 0;

    const client = createClient_SMTP();

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
              ${personalizedContent.split("\n").map((line) => `<p style="margin: 0 0 15px 0; line-height: 1.6;">${esc(line)}</p>`).join("")}
            </div>
            <div style="background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
              <p style="margin: 0;">© DIT ${new Date().getFullYear()}</p>
            </div>
          </div>
        `;

        await client.send({
          from: gmailUser,
          to: recipient.email,
          subject: personalizedSubject,
          html: htmlContent,
        });

        const messageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        sentCount++;
        
        // Log the email
        await supabaseClient.from("email_logs").insert({
          recipient_email: recipient.email,
          subject: personalizedSubject,
          sent_by: userId,
          status: "sent",
          delivery_status: "sent",
          resend_email_id: messageId,
        });
      } catch (error) {
        failedCount++;
        console.error(`Failed to send to ${recipient.email}:`, error);
      }
    }

    await client.close();

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
