import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

async function deriveSecret(key: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`telegram-webhook:${key}`));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(a: string | null, b: string) {
  if (!a || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const WELCOME =
  "🎓 <b>እንኳን ወደ ተፈሪ መኮንን ፖሊ ቴክኒክ ኮሌጅ በደህና መጡ!</b>\nWelcome to Teferi Mekonnen Polytechnic College!\n\n" +
  "የማመልከቻዎን ሁኔታ ለማወቅ የተማሪ መለያ ቁጥርዎን (Student ID) ይላኩ።\nSend your <b>Student ID</b> to check your application status.";

function statusText(status: string, dept: string | null) {
  switch (status) {
    case "approved":
    case "completed":
      return `✅ <b>ተቀባይነት አግኝቷል / APPROVED</b>${dept ? `\nDepartment: <b>${esc(dept)}</b>` : ""}\n\nእባክዎ አይዲዎን እና ከ8ኛ–12ኛ ክፍል ማስረጃዎችዎን ይዘው ወደ ኮሌጁ በአካል ይቅረቡ።\nPlease bring your ID and Grade 8–12 documents to the college in person.`;
    case "waiting_list":
      return "🕒 <b>በተጠባባቂ ዝርዝር / WAITING LIST</b>\nYour application is on the waiting list.";
    case "rejected":
      return "❌ <b>ተቀባይነት አላገኘም / NOT ACCEPTED</b>\nYour application was not accepted. Contact the college for details.";
    default:
      return "⏳ <b>በግምገማ ላይ / PENDING</b>\nYour application is still under review. Please check again later.";
  }
}

async function send(chatId: number, text: string) {
  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": Deno.env.get("TELEGRAM_API_KEY")!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) console.error(`sendMessage failed [${res.status}]: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const key = Deno.env.get("TELEGRAM_API_KEY");
  if (!key || !Deno.env.get("LOVABLE_API_KEY")) return new Response("Not configured", { status: 500 });
  if (!safeEqual(req.headers.get("X-Telegram-Bot-Api-Secret-Token"), await deriveSecret(key))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const msg = update?.message ?? update?.edited_message;
  const chatId = msg?.chat?.id;
  const text: string = (msg?.text ?? "").trim();
  if (!chatId) return Response.json({ ok: true });

  if (!text || text.startsWith("/start") || text.startsWith("/help")) {
    await send(chatId, WELCOME);
    return Response.json({ ok: true });
  }

  const code = text.replace(/\s+/g, "").toUpperCase().slice(0, 40);
  if (!/^[A-Z0-9\-\/]{3,40}$/.test(code)) {
    await send(chatId, "⚠️ ትክክለኛ የተማሪ መለያ ቁጥር ያስገቡ።\nPlease send a valid Student ID.");
    return Response.json({ ok: true });
  }

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile } = await db.from("profiles").select("id, full_name, student_code").ilike("student_code", code).maybeSingle();

  if (!profile) {
    await send(chatId, `🔍 <b>${esc(code)}</b> አልተገኘም / not found.\nእባክዎ ቁጥሩን አረጋግጠው እንደገና ይሞክሩ። Please check the ID and try again.`);
    return Response.json({ ok: true });
  }

  const { data: app } = await db.from("applications").select("id, status, first_choice").eq("user_id", profile.id).maybeSingle();
  const firstName = esc((profile.full_name ?? "").split(" ")[0] || "Student");

  if (!app) {
    await send(chatId, `👤 ${firstName} (${esc(profile.student_code)})\n\n📝 ማመልከቻዎን አላጠናቀቁም። / You have not completed your application yet. Please finish it on the portal.`);
    return Response.json({ ok: true });
  }

  const { data: placement } = await db.from("department_placements").select("placed_department").eq("application_id", app.id).maybeSingle();
  await send(chatId, `👤 ${firstName} (${esc(profile.student_code)})\n\n${statusText(app.status ?? "pending", placement?.placed_department ?? null)}`);
  return Response.json({ ok: true });
});
