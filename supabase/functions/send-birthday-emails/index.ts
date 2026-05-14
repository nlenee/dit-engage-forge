import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require CRON_SECRET (or admin fallback)
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret) {
      if (req.headers.get("x-cron-secret") !== cronSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    } else {
      const authHeader = req.headers.get("Authorization");
      const tmp = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
      if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
      const { data: { user } } = await tmp.auth.getUser(authHeader.replace("Bearer ", ""));
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
      const { data: roles } = await tmp.from("user_roles").select("role").eq("user_id", user.id);
      const ok = (roles || []).some((r: any) => ["admin","executive_secretary","community_manager"].includes(r.role));
      if (!ok) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    
    if (!gmailUser || !gmailPassword) {
      throw new Error("Gmail credentials are not configured");
    }

    // Get today's date in MM-DD format
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayMMDD = `${month}-${day}`;

    console.log(`Checking for birthdays on ${todayMMDD}`);

    // Get members with birthday today
    const { data: members, error: membersError } = await supabaseClient
      .from("members")
      .select("*");

    if (membersError) throw membersError;

    const birthdayMembers = members.filter((member) => {
      if (!member.birthday) return false;
      const bday = member.birthday.slice(5); // Get MM-DD part
      return bday === todayMMDD;
    });

    console.log(`Found ${birthdayMembers.length} members with birthday today`);

    if (birthdayMembers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No birthdays today", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get birthday template
    const { data: templates } = await supabaseClient
      .from("email_templates")
      .select("*")
      .eq("type", "birthday")
      .limit(1);

    const template = templates?.[0];
    
    const defaultSubject = "Happy Birthday from DIT! 🎂";
    const defaultContent = `Dear {{name}},

On behalf of everyone at DIT, we want to wish you a wonderful birthday filled with joy and happiness!

May this new year of your life bring you success, health, and all the blessings you deserve.

Warmest wishes,
The DIT Team`;

    let sentCount = 0;
    const client = createClient_SMTP();

    for (const member of birthdayMembers) {
      try {
        const firstName = member.full_name.split(" ")[0];
        const subject = (template?.subject || defaultSubject).replace(/\{\{name\}\}/g, firstName);
        const content = (template?.content || defaultContent).replace(/\{\{name\}\}/g, firstName);

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 48px;">🎂</h1>
              <h2 style="color: white; margin: 10px 0 0 0;">Happy Birthday!</h2>
            </div>
            <div style="padding: 30px; background: #fff7ed; border: 1px solid #fed7aa;">
              ${content.split("\n").map((line: string) => `<p style="margin: 0 0 15px 0; line-height: 1.6;">${line}</p>`).join("")}
            </div>
            <div style="background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
              <p style="margin: 0;">© DIT ${new Date().getFullYear()}</p>
            </div>
          </div>
        `;

        await client.send({
          from: gmailUser,
          to: member.email,
          subject,
          html: htmlContent,
        });

        const messageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        sentCount++;
        
        await supabaseClient.from("email_logs").insert({
          recipient_email: member.email,
          subject,
          status: "sent",
          delivery_status: "sent",
          resend_email_id: messageId,
        });
        
        console.log(`Birthday email sent to ${member.email}`);
      } catch (error) {
        console.error(`Failed to send birthday email to ${member.email}:`, error);
      }
    }

    await client.close();

    return new Response(
      JSON.stringify({ 
        message: `Sent ${sentCount} birthday emails`, 
        count: sentCount 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Birthday email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
