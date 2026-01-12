import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, type = "enhance" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    if (type === "enhance") {
      systemPrompt = `You are a professional business letter editor for DIT (Divine Intelligence Team). 
Your task is to enhance the provided letter content while:
- Maintaining a formal, professional, and authoritative tone
- Improving clarity and readability
- Keeping the original meaning and intent intact
- Preserving any placeholders like [POSITION]
- Keeping bullet points formatted consistently
- Ensuring proper grammar and punctuation

Return ONLY the enhanced text, no explanations or additional commentary.`;
    } else if (type === "proofread") {
      systemPrompt = `You are a professional proofreader. 
Fix any grammar, spelling, or punctuation errors in the provided text.
Maintain the original formatting and structure.
Return ONLY the corrected text, no explanations.`;
    } else if (type === "formal") {
      systemPrompt = `You are a formal business writing expert.
Rewrite the provided text to be more formal and professional.
Maintain the original meaning and any placeholders.
Return ONLY the formal version, no explanations.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const enhancedText = data.choices?.[0]?.message?.content;

    if (!enhancedText) {
      throw new Error("No response from AI");
    }

    return new Response(JSON.stringify({ enhancedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in enhance-text function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
