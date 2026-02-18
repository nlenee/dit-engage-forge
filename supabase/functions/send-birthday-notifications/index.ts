import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["divintelteam@gmail.com", "nleneeletura@gmail.com"];

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
      console.log("Email service not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all members with birthdays
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("*")
      .not("birthday", "is", null);

    if (membersError) throw membersError;

    const notifications7Days: any[] = [];
    const notifications24Hours: any[] = [];

    members?.forEach((member) => {
      if (!member.birthday) return;
      
      const birthdayThisYear = new Date(
        today.getFullYear(),
        parseInt(member.birthday.split("-")[1]) - 1,
        parseInt(member.birthday.split("-")[2])
      );

      // If birthday already passed this year, check next year
      if (birthdayThisYear < today) {
        birthdayThisYear.setFullYear(birthdayThisYear.getFullYear() + 1);
      }

      const diffDays = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 7) {
        notifications7Days.push(member);
      } else if (diffDays === 1) {
        notifications24Hours.push(member);
      }
    });

    const client = createClient_SMTP();

    // Send 7-day notifications
    if (notifications7Days.length > 0) {
      const membersList = notifications7Days
        .map((m) => `<li><strong>${m.full_name}</strong> - ${m.email}</li>`)
        .join("");

      for (const adminEmail of ADMIN_EMAILS) {
        await client.send({
          from: gmailUser,
          to: adminEmail,
          subject: `🎂 Upcoming Birthdays in 7 Days - ${notifications7Days.length} member(s)`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎂 Birthday Alert</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0;">7 Days Notice</p>
              </div>
              <div style="padding: 30px; background-color: #f8fafc;">
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                  The following members have birthdays coming up in 7 days:
                </p>
                <ul style="color: #334155; font-size: 14px; line-height: 1.8;">
                  ${membersList}
                </ul>
                <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
                  You will receive another reminder 24 hours before.
                </p>
              </div>
            </div>
          `,
        });
      }

      console.log(`Sent 7-day birthday notifications for ${notifications7Days.length} members`);
    }

    // Send 24-hour notifications
    if (notifications24Hours.length > 0) {
      const membersList = notifications24Hours
        .map((m) => `<li><strong>${m.full_name}</strong> - ${m.email}</li>`)
        .join("");

      for (const adminEmail of ADMIN_EMAILS) {
        await client.send({
          from: gmailUser,
          to: adminEmail,
          subject: `🎉 Birthdays TOMORROW - ${notifications24Hours.length} member(s)`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Birthday Tomorrow!</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0;">24 Hour Notice</p>
              </div>
              <div style="padding: 30px; background-color: #f8fafc;">
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                  <strong>Action Required!</strong> The following members have birthdays TOMORROW:
                </p>
                <ul style="color: #334155; font-size: 14px; line-height: 1.8;">
                  ${membersList}
                </ul>
                <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
                  Birthday emails will be sent automatically on their birthday.
                </p>
              </div>
            </div>
          `,
        });
      }

      console.log(`Sent 24-hour birthday notifications for ${notifications24Hours.length} members`);
    }

    await client.close();

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications7Days: notifications7Days.length,
        notifications24Hours: notifications24Hours.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-birthday-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
