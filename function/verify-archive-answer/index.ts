import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizeAnswer(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token || token === authHeader) {
      return Response.json({ error: "A valid player session is required." }, { status: 401, headers: corsHeaders });
    }

    const url = Deno.env.get("SUPABASE_URL");
    let secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!secret) {
      const secretMap = Deno.env.get("SUPABASE_SECRET_KEYS");
      if (secretMap) {
        try { secret = JSON.parse(secretMap).default; } catch { /* use legacy env if available */ }
      }
    }
    if (!url || !secret) {
      return Response.json({ error: "Server validation is not configured." }, { status: 503, headers: corsHeaders });
    }

    const admin = createClient(url, secret, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) {
      return Response.json({ error: "Player session is invalid. Refresh the archive and try again." }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const caseNumber = Number(body.case_number);
    const answer = normalizeAnswer(body.answer);
    if (!Number.isInteger(caseNumber) || caseNumber < 1 || caseNumber > 13 || !answer || answer.length > 160) {
      return Response.json({ error: "Invalid finding submission." }, { status: 400, headers: corsHeaders });
    }

    const { data, error } = await admin
      .from("archive_answer_keys")
      .select("accepted_answers")
      .eq("case_number", caseNumber)
      .maybeSingle();

    if (error || !data) {
      console.error("Answer key lookup failed", error?.message);
      return Response.json({ error: "The archive could not verify this finding. Try again later." }, { status: 503, headers: corsHeaders });
    }

    const accepted = (data.accepted_answers as string[]).map(normalizeAnswer);
    const correct = accepted.includes(answer);
    return Response.json({ correct }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("verify-archive-answer error", error);
    return Response.json({ error: "Unexpected validation error." }, { status: 500, headers: corsHeaders });
  }
});
