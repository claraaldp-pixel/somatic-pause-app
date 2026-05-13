import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the caller is the admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: callerError } = await supabase.auth.getUser(token);
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (caller.email !== adminEmail) {
      return new Response(JSON.stringify({ error: "Only the admin can invite users." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add to whitelist
    const { error: whitelistError } = await supabase
      .from("whitelist")
      .upsert({ email: email.trim().toLowerCase() }, { onConflict: "email" });

    if (whitelistError) {
      return new Response(JSON.stringify({ error: whitelistError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send Supabase invitation email
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email.trim().toLowerCase(),
      { redirectTo: Deno.env.get("APP_URL") },
    );

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
