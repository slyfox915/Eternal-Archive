THE ETERNAL ARCHIVE — SECURE ANSWER VALIDATION
Project: kuppxzrlemaevrwijhgb (arg)

WHAT HAS BEEN DONE IN THE CONNECTED SUPABASE PROJECT
- Created public.archive_answer_keys with 13 case answer sets.
- Enabled RLS and revoked table privileges from PUBLIC, anon, and authenticated.
- Granted server-side access to service_role only.
- Deployed Edge Function: verify-archive-answer (ACTIVE, JWT verification enabled).
- Updated the combined Stage 1–5 website so all 13 case checks call the Edge Function.
- Removed the client-side answer arrays from index.html. The browser receives only { correct: true/false }.

DEPLOYMENT
1. Replace the hosted site's index.html with this package's index.html.
2. Keep the existing Supabase project URL and publishable key in the page.
3. The Edge Function is already deployed to the connected Supabase project. The function uses Supabase's server-side secret environment variable; do not put a secret/service-role key in the website.
4. Keep Anonymous Sign-Ins enabled because the website uses anonymous player sessions and the function requires a valid player JWT.
5. Test a correct and incorrect answer for a case in a fresh browser session, then check that progress still syncs.

ANSWER PRIVACY
- The answer key is stored in a table with RLS enabled and no client-facing policies; anon/authenticated table grants are revoked.
- The Edge Function authenticates the player's JWT, reads the answer key server-side, and returns only a boolean.
- Do not grant SELECT on archive_answer_keys to anon or authenticated. Do not add a public RLS policy.
- Never add a Supabase secret/service-role key to index.html, source control, or a public ZIP.

IMPORTANT LIMITATIONS
- This prevents simply viewing the answer arrays in browser DevTools or reading the table as a normal player. It cannot prevent a determined player from discovering answers from visible clues, hints, network behavior, or sharing answers with others.
- Existing progress rows were preserved. The existing player_progress table and policies were not changed.
- Stage 3/4/5 progress still uses the existing JSON progress record; this update changes answer validation only.
- JavaScript syntax and ZIP integrity were checked. A full live browser/player end-to-end test was not run in this session.

FILES
- index.html — complete combined website, Stages 1–5
- supabase_secure_answers.sql — migration SQL reference (already applied)
- functions/verify-archive-answer/index.ts — deployed function source
- functions/verify-archive-answer/deno.json — function config
