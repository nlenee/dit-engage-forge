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

    let suggestedFaction: string | null = app.selected_faction || null;
    let factionScores: Record<string, number> = {};
    let factionReasoning: any = {};
    let roleSuggestions: any[] = [];
    let placementFlag = false;
    let flagReason: string | null = null;
    let aboutScore = { human: 0.8, ai: 0.2 };
    let whyScore = { human: 0.8, ai: 0.2 };

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    try {
      if (lovableKey && app.application_type === "membership") {
        const summary = (responses || []).map((r: any) =>
          `${r.question_text || r.question_key}: ${typeof r.response_value === "object" ? r.response_value?.value ?? "" : r.response_value}`
        ).join("\n");

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${lovableKey}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: `You are DIT's placement assistant. Factions: shi (Secured Health Initiative — health & humanitarian), mindup (Education), teck (Tecknallogy — technology), dyp (Discover Your Purpose). Return strict JSON: {"primary_faction":"shi|mindup|teck|dyp","scores":{"shi":0..1,"mindup":0..1,"teck":0..1,"dyp":0..1},"reasoning":"short paragraph","roles":["role1","role2"],"flag":boolean,"flag_reason":"string or null"}. Set flag=true only if red flags appear (incoherent answers, mismatch, abuse).` },
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
              if (FACTIONS.includes(parsed.primary_faction)) suggestedFaction = parsed.primary_faction;
              factionScores = parsed.scores || {};
              factionReasoning = { reasoning: parsed.reasoning };
              roleSuggestions = parsed.roles || [];
              placementFlag = !!parsed.flag;
              flagReason = parsed.flag_reason || null;
            } catch { /* ignore */ }
          }
        }

        // AI-content advisory scoring for the two long-form fields
        if (app.about_yourself || app.why_join_dit) {
          const scoreResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${lovableKey}` },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { role: "system", content: `Estimate the probability that each passage was AI-generated vs human-written. Return strict JSON: {"about":{"human":0..1,"ai":0..1},"why":{"human":0..1,"ai":0..1}}. Be conservative — only flag obvious AI patterns.` },
                { role: "user", content: `ABOUT:\n${app.about_yourself || "(empty)"}\n\nWHY:\n${app.why_join_dit || "(empty)"}` },
              ],
              response_format: { type: "json_object" },
            }),
          });
          if (scoreResp.ok) {
            const j = await scoreResp.json();
            try {
              const p = JSON.parse(j.choices?.[0]?.message?.content || "{}");
              if (p.about) aboutScore = { human: Number(p.about.human) || 0, ai: Number(p.about.ai) || 0 };
              if (p.why) whyScore = { human: Number(p.why.human) || 0, ai: Number(p.why.ai) || 0 };
            } catch { /* ignore */ }
          }
        }

        await supabase.from("ai_placement_results").insert({
          application_id,
          primary_faction: suggestedFaction,
          faction_scores: factionScores,
          faction_reasoning: factionReasoning,
          role_suggestions: roleSuggestions,
          placement_flag: placementFlag,
          flag_reason: flagReason,
          model_version: "gemini-2.5-flash",
        });
      }
    } catch (e) {
      console.error("AI placement failed:", e);
    }

    await supabase.from("applications").update({
      ai_suggested_faction: suggestedFaction,
      ai_role_suggestions: roleSuggestions,
      placement_flag: placementFlag,
      ai_about_human_score: aboutScore.human,
      ai_about_ai_score: aboutScore.ai,
      ai_why_human_score: whyScore.human,
      ai_why_ai_score: whyScore.ai,
      status: "under_review",
    }).eq("id", application_id);

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
              <h1 style="color:#0a1f44">Thank you, ${(app.applicant_name || "").split(" ")[0]}!</h1>
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
      ok: true, suggested_faction: suggestedFaction, flagged: placementFlag,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
