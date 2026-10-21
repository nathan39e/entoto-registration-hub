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

const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Keep in sync with src/components/ApplyWarning.tsx
const APPLY_WARNING = "እባክዎ ሳይን አፕ (Sign Up) ካደረጉ በኋላ ሙሉ ፎርሙን አጠናቀው ይሙሉ፤ በመጨረሻም የሚሰጥዎትን አይዲ (ID) እና ከ8ኛ እስከ 12ኛ ክፍል ያሉትን የትምህርት ዶክመንቶች (ማስረጃዎች) ይዘው ወደ ተፈሪ መኮንን ፖሊ ቴክኒክ እና ሙያ ኮሌጅ በአካል በመቅረብ ያስገቡ።";

const WELCOME =
  "🎓 <b>እንኳን ወደ ተፈሪ መኮንን ፖሊ ቴክኒክ ኮሌጅ በደህና መጡ!</b>\nWelcome to Teferi Mekonnen Polytechnic College!\n\n" +
  "የማመልከቻዎን ሁኔታ ለማወቅ የተማሪ መለያ ቁጥርዎን (Student ID) ይላኩ።\nSend your <b>Student ID</b> to check your application status.\n\nMenu: /status /departments /contact /website /help";

const SITE = "https://tafarimakonnenn.onrender.com";

const HELP =
  "ℹ️ <b>እገዛ / Help</b>\n\n" +
  "/status — የማመልከቻ ሁኔታ / Check application status\n" +
  "/departments — ዲፓርትመንቶች / Departments & programs\n" +
  "/contact — አድራሻ / Contact the college\n" +
  "/website — ድረ-ገጽ / Portal links\n" +
  "/help — ይህ መልዕክት / This message\n\n" +
  "💡 የተማሪ መለያ ቁጥርዎን በቀጥታ መላክም ይችላሉ።\nYou can also just send your Student ID directly.";

const DEPT_LIST: [string, string[]][] = [
  ["Aesthetics", ["Painting", "Sculpture", "Graphics Art", "Photography & Videography", "Music Instrument", "Cultural Music Instrument", "Vocal Performance", "Theatrical Art", "Football Coaching", "Athletics Coaching"]],
  ["ICT", ["Web Development & Database Administration", "Hardware & Networking Service"]],
  ["Garment and Textile", ["Fashion Design", "Garment Production", "Textile Processing", "Footwear Production", "Weaving & Knitting", "Leather Garment & Good Production"]],
  ["Hotel and Tourism", ["Front Office", "Food & Beverage Service", "Culinary Art", "Tour Guiding", "Tour Operation", "Hair Dressing & Beautification"]],
  ["Automotive Technology", ["Automotive Mechanics", "Automotive Electrical & Electronics"]],
  ["Business and Finance", ["Marketing & Sales Management", "Accounting & Finance", "Human Resource Management", "Secretarial & Office Admin"]],
  ["Electrical and Electronics", ["Electrical Electronics Equipment Service", "Industrial Electrical Electronics Control", "Building Electrical Installation"]],
  ["Urban Agriculture", ["Animal Production", "Crop Production"]],
  ["Construction Technology", ["Finishing Construction", "Structural Construction", "Plumbing Installation", "Road Construction"]],
  ["Wood Work and Metal Technology", ["Furniture Making", "Welding", "Mechanics", "Machine"]],
];

const DEPARTMENTS =
  "🏫 <b>ዲፓርትመንቶች / Departments</b>\n\n" +
  DEPT_LIST.map(([d, f]) => `<b>${d}</b>\n• ${f.join("\n• ")}`).join("\n\n") +
  `\n\nዝርዝር መረጃ / Details: ${SITE}/departments`;

const CONTACT =
  "📞 <b>አድራሻ / Contact</b>\n\n" +
  "Teferi Mekonnen Polytechnic College\n" +
  "📱 Phone: +251945753837\n" +
  `🌐 ${SITE}/contact\n\n` +
  "ለበለጠ መረጃ የሬጅስትራር ቢሮን በአካል ይጎብኙ።\nFor more information, visit the Registrar Office in person.";

const WEBSITE =
  "🌐 <b>ድረ-ገጽ / Website</b>\n\n" +
  `🏠 Home: ${SITE}\n📝 Apply / Sign up: ${SITE}/auth\n📖 How to apply: ${SITE}/how-to-apply\n📰 News: ${SITE}/news`;

function statusText(status: string, dept: string | null, missingDocs: boolean) {
  const bringDocs = missingDocs
    ? "\n\nእባክዎ አይዲዎን እና ከ8ኛ–12ኛ ክፍል ማስረጃዎችዎን ይዘው ወደ ኮሌጁ በአካል ይቅረቡ።\nPlease bring your ID and Grade 8–12 documents to the college in person."
    : "";
  switch (status) {
    case "approved":
    case "completed":
      return `✅ <b>ተቀባይነት አግኝቷል / APPROVED</b>${dept ? `\nDepartment: <b>${esc(dept)}</b>` : ""}${bringDocs}`;

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

  const cmd = text.startsWith("/") ? text.split(/\s+/)[0].split("@")[0].toLowerCase() : "";
  let input = text;
  if (!text || cmd === "/start") { await send(chatId, WELCOME); return Response.json({ ok: true }); }
  if (cmd === "/help") { await send(chatId, HELP); return Response.json({ ok: true }); }
  if (cmd === "/departments") { await send(chatId, DEPARTMENTS); return Response.json({ ok: true }); }
  if (cmd === "/contact") { await send(chatId, CONTACT); return Response.json({ ok: true }); }
  if (cmd === "/website") { await send(chatId, WEBSITE); return Response.json({ ok: true }); }
  if (cmd === "/status") {
    input = text.split(/\s+/).slice(1).join("");
    if (!input) {
      await send(chatId, "🔎 የተማሪ መለያ ቁጥርዎን (Student ID) ይላኩ።\nPlease send your <b>Student ID</b> now (e.g. <code>/status TMP-2026-0001</code> or just the ID).");
      return Response.json({ ok: true });
    }
  } else if (cmd) {
    await send(chatId, HELP);
    return Response.json({ ok: true });
  }

  const code = input.replace(/\s+/g, "").toUpperCase().slice(0, 40);
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

  const { data: app } = await db.from("applications")
    .select("id, status, first_choice, second_choice, third_choice, documents, result_doc_path")
    .eq("user_id", profile.id).maybeSingle();
  const header = `👤 <b>${esc(profile.full_name || "Student")}</b>\n🆔 ${esc(profile.student_code)}`;

  if (!app) {
    await send(chatId, `${header}\n\n📝 ማመልከቻዎን አላጠናቀቁም። / You have not completed your application yet. Please finish it on the portal.\n\n⚠️ ${APPLY_WARNING}`);
    return Response.json({ ok: true });
  }

  const docs = (app.documents ?? {}) as Record<string, unknown>;
  const has = (k: string) => !!docs[k] && (!Array.isArray(docs[k]) || (docs[k] as unknown[]).length > 0);
  const checks: [string, boolean][] = [
    ["Grade 12 result", has("grade12") || !!app.result_doc_path],
    ["Grade 8 certificate", has("grade8")],
    ["Transcripts (9–12)", has("transcript") || has("transcripts")],
    ["Photo", has("photo")],
  ];
  const missing = checks.some(([, ok]) => !ok);
  const docLines = checks.map(([n, ok]) => `${ok ? "✅" : "❌"} ${n}`).join("\n");

  const depts = `🏫 <b>Department choices:</b>\n1. ${esc(app.first_choice)}\n2. ${esc(app.second_choice)}\n3. ${esc(app.third_choice)}`;

  const { data: placement } = await db.from("department_placements").select("placed_department").eq("application_id", app.id).maybeSingle();
  let reply = `${header}\n\n${depts}\n\n📄 <b>Documents / ማስረጃዎች:</b>\n${docLines}\n\n${statusText(app.status ?? "pending", placement?.placed_department ?? null, missing)}`;
  if (missing) reply += `\n\n⚠️ <b>ሁሉንም ማስረጃዎች አልጫኑም / Documents missing</b>\n${APPLY_WARNING}`;
  await send(chatId, reply);
  return Response.json({ ok: true });
});
