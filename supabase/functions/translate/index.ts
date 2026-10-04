const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" },
    });
    if (!auth.startsWith("Bearer ") || !userRes.ok) return json({ error: "Sign in required" }, 401);
    const { texts } = await req.json();
    if (!Array.isArray(texts) || texts.length === 0 || texts.length > 120) return json({ error: "Send 1-120 texts" }, 400);
    const clean = texts.map((t) => String(t).slice(0, 2000));
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You translate website UI text for an Ethiopian polytechnic college from English to Amharic (Ge'ez script). Keep numbers, emails, URLs, codes (like EPC1234ABCD), currency 'ETB' and punctuation. Return exactly one translation per input, same order." },
          { role: "user", content: JSON.stringify(clean) },
        ],
        tools: [{ type: "function", function: { name: "return_translations", parameters: { type: "object", properties: { translations: { type: "array", items: { type: "string" } } }, required: ["translations"] } } }],
        tool_choice: { type: "function", function: { name: "return_translations" } },
      }),
    });
    if (res.status === 429) return json({ error: "Too many requests" }, 429);
    if (res.status === 402) return json({ error: "AI credits exhausted" }, 402);
    const data = await res.json();
    const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");
    const out: string[] = Array.isArray(args.translations) ? args.translations : [];
    return json({ translations: clean.map((t, i) => (typeof out[i] === "string" && out[i] ? out[i] : t)) });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
