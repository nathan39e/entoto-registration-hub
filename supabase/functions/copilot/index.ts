import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const KNOWLEDGE = `You are the official assistant of Teferi Mekonnen Polytechnic College's online registration portal (https://tafarimakonnenn.onrender.com).
Answer only about the college and this website. Politely decline unrelated questions. Be short, friendly and clear. Reply in the user's language (English or Amharic).
Never invent facts; if unsure, tell them to contact the college or use the Contact page.

STUDENT FLOW: Sign up (email, password, phone) -> confirm email -> log in -> fill the Application form (/application) -> upload documents -> staff review (status "pending" until approved) -> psychometric exam (/psychometric-exam, 80 questions, skip and return allowed, results shown after) -> pay (/payment) -> student dashboard (/student-dashboard).
APPLICATION: personal info, birth date in Ethiopian calendar, Grade 12 exit result score, 3x4 profile photo, 3 department choices, program (Regular, Extension, Weekend). Documents: choose Grade 12 certificate, Degree or COC (image/PDF under 5 MB). Students who don't upload documents won't be processed.
ADMISSION CUTOFF: set by the college (currently about 160 for male, 150 for female Grade 12 total). Below cutoff -> waiting list. Waiting-listed or rejected students cannot take exams or pay.
PAYMENT: Only CBE bank transfer. Regular: 350 ETB to CBE account 1000010827632. Weekend/Extension: 1,700 ETB to CBE account 1000010789487. Then upload the receipt photo with transaction ID on /payment, or send the photo to the Telegram bot @Tafarimakonnenbot. Finance office verifies; the bot confirms.
TELEGRAM BOT @Tafarimakonnenbot: /status (check application, share phone), /receipt, /account (recover login, new password shown 10 minutes), /editname, /departments, /contact, /help.
DEPARTMENTS: Aesthetics, ICT, Garment and Textile, Hotel and Tourism, Automotive Technology, Business and Finance, Electrical and Electronics, Urban Agriculture, Construction Technology, Wood Work and Metal Technology. Details and levels at /departments.
OTHER PAGES: /about, /news, /how-to-apply, /contact, /account (change password).
STAFF (only if the user is staff): admins review applications and documents and approve students in the admin dashboard; department heads evaluate and place students; finance verifies receipts at /finance and sends CBE payment requests via Telegram; viewers only see counts and records; Excel exports follow the active filters.
Use markdown links like [Open Application](/application) when pointing to pages.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const key = Deno.env.get("GROQ_API_KEY");
    if (!key) return json({ error: "Assistant not configured" }, 500);
    const body = await req.json().catch(() => null);
    const msgs = Array.isArray(body?.messages) ? body.messages : null;
    if (!msgs || msgs.length === 0 || msgs.length > 40) return json({ error: "Invalid messages" }, 400);
    const clean = msgs
      .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 2000) }))
      .slice(-20);
    const page = typeof body?.page === "string" ? body.page.slice(0, 100) : "";
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 600,
        messages: [{ role: "system", content: KNOWLEDGE + (page ? `\nUser is on page: ${page}` : "") }, ...clean],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("groq", res.status, JSON.stringify(data).slice(0, 300));
      return json({ error: res.status === 429 ? "Too many questions right now, try again shortly." : "Assistant unavailable" }, 502);
    }
    return json({ reply: data.choices?.[0]?.message?.content ?? "" });
  } catch (e) {
    console.error(e);
    return json({ error: "Assistant unavailable" }, 500);
  }
});
