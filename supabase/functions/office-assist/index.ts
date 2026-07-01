import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { title, intent, faction } = await req.json();
    if (!title || typeof title !== 'string') {
      return new Response(JSON.stringify({ error: 'title required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');

    const permissionKeys = [
      'applications.review','applications.schedule','members.manage','directory.manage',
      'announcements.publish','letters.create','finance.view','finance.manage',
      'faction.manage','offices.manage','admin.settings'
    ];

    const system = `You are an org design assistant for the Divine Intelligence Team (DIT). Given an office title and optional intent, produce:
- description (2-3 sentences, professional tone)
- kpis: 3-6 measurable outcomes
- permissions: subset of this allowed list: ${permissionKeys.join(', ')}
Return ONLY JSON with keys description, kpis (string[]), permissions (string[]).`;

    const userMsg = `Title: ${title}\nFaction: ${faction || 'organization-wide'}\nIntent: ${intent || '(none provided)'}\nReturn JSON only.`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: system }, { role: 'user', content: userMsg }],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: `AI ${res.status}: ${t}` }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await res.json();
    let parsed: any = {};
    try { parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}'); } catch { parsed = {}; }
    const perms = Array.isArray(parsed.permissions) ? parsed.permissions.filter((p: string) => permissionKeys.includes(p)) : [];
    return new Response(JSON.stringify({
      description: typeof parsed.description === 'string' ? parsed.description : '',
      kpis: Array.isArray(parsed.kpis) ? parsed.kpis.slice(0, 8) : [],
      permissions: perms,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});