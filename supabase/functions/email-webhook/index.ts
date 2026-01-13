import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    to: string[];
    from: string;
    subject: string;
    created_at: string;
    // For bounce events
    bounce?: {
      message: string;
    };
  };
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

    const event: ResendWebhookEvent = await req.json();
    console.log("Received webhook event:", event.type, event.data.email_id);

    const emailId = event.data.email_id;

    switch (event.type) {
      case "email.sent":
        await supabaseClient
          .from("email_logs")
          .update({ delivery_status: "sent" })
          .eq("resend_email_id", emailId);
        break;

      case "email.delivered":
        await supabaseClient
          .from("email_logs")
          .update({ delivery_status: "delivered" })
          .eq("resend_email_id", emailId);
        break;

      case "email.opened":
        await supabaseClient
          .from("email_logs")
          .update({ 
            delivery_status: "opened",
            opened_at: new Date().toISOString() 
          })
          .eq("resend_email_id", emailId);
        break;

      case "email.bounced":
        await supabaseClient
          .from("email_logs")
          .update({
            delivery_status: "bounced",
            bounced_at: new Date().toISOString(),
            bounce_reason: event.data.bounce?.message || "Unknown bounce reason",
          })
          .eq("resend_email_id", emailId);
        break;

      case "email.complained":
        await supabaseClient
          .from("email_logs")
          .update({ delivery_status: "complained" })
          .eq("resend_email_id", emailId);
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
