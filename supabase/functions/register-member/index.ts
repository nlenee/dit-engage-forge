import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegisterMemberRequest {
  token: string;
  full_name: string;
  email: string;
  phone?: string;
  country: string;
  state?: string;
  birthday: string;
  joined_dit_date: string;
  faction: string;
  bio?: string;
  role_in_dit?: string;
  testimony?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const data: RegisterMemberRequest = await req.json();

    // Validate required fields
    if (!data.token || !data.full_name || !data.email || !data.country || !data.birthday || !data.joined_dit_date || !data.faction) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate invitation token
    const { data: invitation, error: invError } = await supabase
      .from("member_invitations")
      .select("*")
      .eq("token", data.token)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (invError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email matches invitation
    if (invitation.email.toLowerCase() !== data.email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Email does not match invitation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if member already exists
    const { data: existingMember } = await supabase
      .from("members")
      .select("id")
      .eq("email", data.email)
      .single();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: "A member with this email already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create member
    const { data: member, error: memberError } = await supabase
      .from("members")
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        country: data.country,
        state: data.state,
        birthday: data.birthday,
        joined_dit_date: data.joined_dit_date,
        faction: data.faction,
        bio: data.bio?.substring(0, 50),
        role_in_dit: data.role_in_dit,
        testimony: data.testimony,
        invitation_token: data.token,
        registered_at: new Date().toISOString(),
        email_verified: false,
      })
      .select()
      .single();

    if (memberError) {
      console.error("Error creating member:", memberError);
      throw memberError;
    }

    // Update invitation status
    await supabase
      .from("member_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    console.log(`Member registered: ${data.email}`);

    return new Response(
      JSON.stringify({ success: true, member }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in register-member:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
