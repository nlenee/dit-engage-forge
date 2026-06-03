import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FACTIONS = ["shi", "dyp", "teck", "mindup"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { application_id } = await req.json();
    if (!application_id) {
      return new Response(JSON.stringify({ error: "application_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: app, error: appErr } = await supabase
      .from("applications").select("*").eq("id", application_id).single();
    if (appErr || !app) throw new Error("Application not found");

    const { data: responses } = await supabase
      .from("application_responses").select("section, question_key, question_text, response_value")
      .eq("application_id", application_id);

    // -------- AI placement (Lovable AI / Gemini) --------
    let suggestedFaction: string | null = app.selected_faction || null;
    let suggestionConfidence: number | null = null;
    let roleSuggestions: any[] = [];
    let placementFlag = false;

    try {
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (lovableKey && app.application_type === "membership") {
        const summary = (responses || []).map(r =>
          `${r.question_text || r.question_key}: ${typeof r.response_value === "object" ? r.response_value?.value ?? "" : r.response_value}`
        ).join("\n");

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: `You are DIT's placement assistant. Given an applicant's responses, suggest the best faction from this list: ${FACTIONS.join(", ")}. Respond as strict JSON: {"faction": "shi|dyp|teck|mindup", "confidence": 0..1, "reasoning": "short", "roles": ["..."], "flag": boolean }. Set flag=true if applicant seems unsuited or red flags appear.` },
              { role: "user", content: `Applicant: ${app.applicant_name}\nSelected preference: ${app.selected_faction || "none"}\n\nResponses:\n${summary}` },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (aiResp.ok) {
          const j = await aiResp.json();
          const content = j.choices?.[0]?.message?.content;
          if (content) {
            try {
              const parsed = JSON.parse(content);
              if (FACTIONS.includes(parsed.faction)) suggestedFaction = parsed.faction;
              suggestionConfidence = parsed.confidence ?? null;
              roleSuggestions = parsed.roles || [];
              placementFlag = !!parsed.flag;

              await supabase.from("ai_placement_results").insert({
                application_id,
                suggested_faction: suggestedFaction,
                confidence: suggestionConfidence,
                reasoning: parsed.reasoning || null,
                role_suggestions: roleSuggestions,
                flagged: placementFlag,
                raw_response: j,
              });
            } catch (_) { /* ignore parse errors */ }
          }
        }
      }
    } catch (e) {
      console.error("AI placement failed:", e);
    }

    await supabase.from("applications").update({
      ai_suggested_faction: suggestedFaction,
      ai_role_suggestions: roleSuggestions,
      placement_flag: placementFlag,
      status: "under_review",
    }).eq("id", application_id);

    // -------- Acknowledgement email --------
    try {
      const gmailUser = Deno.env.get("GMAIL_USER");
      const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
      if (gmailUser && gmailPassword) {
        const client = new SMTPClient({
          connection: { hostname: "smtp.gmail.com", port: 465, tls: true,
            auth: { username: gmailUser, password: gmailPassword } },
        });
        await client.send({
          from: `Divine Intelligence Team <${gmailUser}>`,
          to: app.applicant_email,
          subject: `We received your application — ${app.reference_number}`,
          content: "auto",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
              <h1 style="color:#0a1f44">Thank you, ${app.applicant_name.split(" ")[0]}!</h1>
              <p>We've received your application to the Divine Intelligence Team and our review panel will be in touch soon.</p>
              <p>Your reference number is: <strong style="font-size:18px;color:#c9a84c">${app.reference_number}</strong></p>
              <p>You can track progress at any time using your reference number and email address.</p>
              <p style="color:#666;font-size:13px;margin-top:30px">— DIT Recruitment</p>
            </div>`,
        });
        await client.close();

        await supabase.from("notifications_log").insert({
          application_id,
          recipient_email: app.applicant_email,
          notification_type: "acknowledgement",
          delivery_status: "sent",
          subject: `We received your application — ${app.reference_number}`,
        });
      }
    } catch (e) {
      console.error("Acknowledgement email failed:", e);
    }

    return new Response(JSON.stringify({
      ok: true,
      suggested_faction: suggestedFaction,
      flagged: placementFlag,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});