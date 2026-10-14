const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const FIELDS = [
  "firstName", "middleName", "lastName", "gender", "dob", "email", "phone", "region", "subcity", "wereda", "houseNumber",
  "emergencyFirstName", "emergencyMiddleName", "emergencyLastName", "emergencySex", "emergencyRelation", "emergencyPhone",
  "motherFirstName", "motherMiddleName", "motherLastName", "emergencyRegion", "emergencySubcity", "emergencyWereda", "emergencyHouseNumber",
  "disability", "disabilityDetail", "highSchoolName", "grade12Year", "grade8Result", "grade8Year", "stream",
  "english", "physics", "civics", "geography", "naturalMath", "biology", "socialMath", "economics", "aptitude", "chemistry", "history",
  "grade12", "dept1", "occupation1", "dept2", "occupation2", "dept3", "occupation3", "program", "receiptNo",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const userRes = await fetch(`${url}/auth/v1/user`, { headers: { Authorization: auth, apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" } });
    if (!auth.startsWith("Bearer ") || !userRes.ok) return json({ error: "Sign in required" }, 401);
    const user = await userRes.json();
    const rolesRes = await fetch(`${url}/rest/v1/user_roles?select=role&user_id=eq.${user.id}`, {
      headers: { apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
    });
    const roles: { role: string }[] = rolesRes.ok ? await rolesRes.json() : [];
    if (!roles.some((r) => ["admin", "sub_admin", "department_head"].includes(r.role))) return json({ error: "Not allowed" }, 403);

    const { image } = await req.json();
    if (typeof image !== "string" || !image.startsWith("data:image/") || image.length > 8_000_000) return json({ error: "Please upload a valid image (max ~5MB)." }, 400);

    const properties = Object.fromEntries(FIELDS.map((f) => [f, { type: ["string", "null"] }]));
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You read a filled paper APPLICATION FORM of Tafari Makonnen Polytechnic College (handwritten). Extract every filled value. Name = firstName, Father's Name = middleName, Grand Father's Name = lastName. gender: 'male' or 'female'. dob as YYYY-MM-DD if possible. disability: 'yes' or 'no'. stream: 'natural' or 'social'. program: 'Regular', 'Extension' or 'Weekend'. grade12 = ESLCE Result. Subject marks as numbers. Use null for empty or unreadable fields. Never guess." },
          { role: "user", content: [{ type: "text", text: "Extract the form values." }, { type: "image_url", image_url: { url: image } }] },
        ],
        tools: [{ type: "function", function: { name: "report_form", parameters: { type: "object", properties, required: FIELDS } } }],
        tool_choice: { type: "function", function: { name: "report_form" } },
      }),
    });
    if (res.status === 429) return json({ error: "Too many requests, try again shortly." }, 429);
    if (res.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!res.ok) return json({ error: "Could not read the form." }, res.status);
    const data = await res.json();
    const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");
    const fields: Record<string, string> = {};
    for (const f of FIELDS) if (args[f] != null && String(args[f]).trim()) fields[f] = String(args[f]).trim().slice(0, 300);
    return json({ fields });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
