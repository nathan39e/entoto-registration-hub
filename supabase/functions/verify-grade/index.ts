const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" },
    });
    if (!auth.startsWith("Bearer ") || !userRes.ok) {
      return new Response(JSON.stringify({ error: "Sign in required" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const { image, enteredScore } = await req.json();
    if (typeof image !== "string" || !image.startsWith("data:image/") || image.length > 8_000_000) {
      return new Response(JSON.stringify({ error: "Please upload a valid image (max ~5MB)." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You read Ethiopian Grade 12 national exit exam result documents. Extract the TOTAL score. If the image is not a grade 12 result document, return score null." },
          { role: "user", content: [
            { type: "text", text: "Extract the total score from this result document." },
            { type: "image_url", image_url: { url: image } },
          ] },
        ],
        tools: [{ type: "function", function: { name: "report_score", parameters: { type: "object", properties: { score: { type: ["number", "null"] }, is_result_document: { type: "boolean" } }, required: ["score", "is_result_document"] } } }],
        tool_choice: { type: "function", function: { name: "report_score" } },
      }),
    });
    if (res.status === 429) return new Response(JSON.stringify({ error: "Too many requests, try again shortly." }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
    if (res.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
    const data = await res.json();
    const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");
    const extracted = args.score;
    const match = args.is_result_document && extracted != null && Math.abs(Number(extracted) - Number(enteredScore)) < 0.01;
    return new Response(JSON.stringify({ match, extracted, isDocument: !!args.is_result_document }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
