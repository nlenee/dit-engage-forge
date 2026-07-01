import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { applicant_email, applicant_name, date, time, channel, link, notes, application_id } = await req.json();
    if (!applicant_email || !date) {
      return new Response(JSON.stringify({ error: 'applicant_email and date required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!RESEND_API_KEY || !LOVABLE_API_KEY) throw new Error('Email credentials missing');

    const channelLabel = channel === 'in_person' ? 'In person' : channel === 'voice_call' ? 'Voice call' : 'Video call';
    const linkLabel = channel === 'in_person' ? 'Venue' : 'Meeting link';
    const html = `
<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0b1220;color:#e5e7eb;border-radius:12px">
  <h2 style="color:#facc15;margin:0 0 8px">DIT Interview Invitation</h2>
  <p>Hello ${applicant_name || 'there'},</p>
  <p>You've been invited to an interview for your Divine Intelligence Team application.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:6px 0;color:#94a3b8">Date</td><td><b>${date}</b></td></tr>
    ${time ? `<tr><td style="padding:6px 0;color:#94a3b8">Time</td><td><b>${time}</b></td></tr>` : ''}
    <tr><td style="padding:6px 0;color:#94a3b8">Channel</td><td><b>${channelLabel}</b></td></tr>
    ${link ? `<tr><td style="padding:6px 0;color:#94a3b8">${linkLabel}</td><td><a href="${link}" style="color:#38bdf8">${link}</a></td></tr>` : ''}
  </table>
  ${notes ? `<div style="background:#111827;padding:12px 14px;border-radius:8px;margin:12px 0"><div style="font-size:12px;color:#94a3b8;margin-bottom:4px">Notes</div>${String(notes).replace(/</g,'&lt;')}</div>` : ''}
  <p style="color:#94a3b8;font-size:12px;margin-top:24px">Reply to this email if you need to reschedule.</p>
</div>`;

    const resp = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'DIT <onboarding@resend.dev>',
        to: [applicant_email],
        subject: `DIT Interview — ${date}${time ? ' ' + time : ''}`,
        html,
      }),
    });
    const out = await resp.json();
    if (!resp.ok) throw new Error(JSON.stringify(out));

    try {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (SUPABASE_URL && SERVICE) {
        await fetch(`${SUPABASE_URL}/rest/v1/email_logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
          body: JSON.stringify({
            recipient_email: applicant_email,
            subject: `DIT Interview — ${date}`,
            status: 'sent',
            metadata: { application_id, channel, date, time },
          }),
        });
      }
    } catch {}

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});