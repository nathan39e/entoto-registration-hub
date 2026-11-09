import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { ownContact, validFullName } from "./rules.ts";

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
  "የማመልከቻዎን ሁኔታ ለማወቅ የተማሪ መለያ ቁጥርዎን (Student ID) ይላኩ።\nSend your <b>Student ID</b> or tap <b>📱 Share My Phone Number</b> to check your application status. For privacy, typed phone numbers are not accepted.\n\nMenu: /status /editname /departments /contact /website /help";

const SITE = "https://tafarimakonnenn.onrender.com";

const SHARE_KB = { keyboard: [[{ text: "📱 Share My Phone Number", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true };

const STATUS_PROMPT = "🔎 Send your <b>Student ID</b>, or tap <b>📱 Share My Phone Number</b> below. For privacy, only your own Telegram number can be used — typed phone numbers are not accepted.\nየተማሪ መለያ ቁጥርዎን ይላኩ ወይም ከታች ያለውን ቁልፍ ተጭነው የራስዎን ስልክ ቁጥር ያጋሩ።";

const HELP =
  "ℹ️ <b>እገዛ / Help</b>\n\n" +
  "/status — የማመልከቻ ሁኔታ / Check application status\n" +
  "/editname — ሙሉ ስም ማስተካከል / Edit only your full name\n" +
  "/departments — ዲፓርትመንቶች / Departments & programs\n" +
  "/contact — አድራሻ / Contact the college\n" +
  "/website — ድረ-ገጽ / Portal links\n" +
  "/help — ይህ መልዕክት / This message\n\n" +
  "💡 Send your Student ID, or tap 📱 Share My Phone Number to look up your record with your own Telegram number. Typed phone numbers are not accepted for privacy.\nTo change your name: /editname YOUR-STUDENT-ID, share your own Telegram contact, then send your full name. Emergency contacts cannot authorize name changes. /cancel cancels an edit.";

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

async function send(chatId: number, text: string, replyMarkup?: Record<string, unknown>) {
  const gatewayKey = Deno.env.get("LOVABLE_API_KEY");
  const telegramKey = Deno.env.get("TELEGRAM_API_KEY");
  if (!gatewayKey || !telegramKey) throw new Error("Telegram is not configured");
  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...(replyMarkup ? { reply_markup: replyMarkup } : {}) }),
  });
  if (!res.ok) throw new Error(`Telegram request failed [${res.status}]: ${await res.text()}`);
  const result = await res.json();
  if (!result.ok) throw new Error(`Telegram request failed: ${result.description}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const key = Deno.env.get("TELEGRAM_API_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key || !url || !serviceKey || !Deno.env.get("LOVABLE_API_KEY")) return json({ error: "Not configured" }, 500);
  if (!safeEqual(req.headers.get("X-Telegram-Bot-Api-Secret-Token"), await deriveSecret(key))) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
  const update = await req.json().catch(() => null);
  if (!Number.isSafeInteger(update?.update_id)) return json({ error: "Invalid update" }, 400);
  const msg = update?.message;
  const chatId = msg?.chat?.id;
  const text: string = (msg?.text ?? "").trim();
  const sender = msg?.from?.id;
  if (!Number.isSafeInteger(chatId) || !Number.isSafeInteger(sender)) return json({ ok: true });
  if (msg.chat.type !== "private" || chatId !== sender) return json({ ok: true });
  if (text.length > 500) return json({ ok: true });
  const db = createClient(url, serviceKey);
  const rpc = async (name: string, args: Record<string, unknown>) => {
    const { data, error } = await db.rpc(name, args);
    if (error) throw new Error(`${name}: ${error.message}`);
    return data;
  };

  const cmd = text.startsWith("/") ? text.split(/\s+/)[0].split("@")[0].toLowerCase() : "";
  if (cmd === "/cancel") {
    const { error } = await db.from("telegram_name_sessions").delete().eq("chat_id", chatId).eq("sender_id", sender);
    if (error) throw error;
    await send(chatId, "Name edit cancelled. /status to check your application.", { remove_keyboard: true });
    return json({ ok: true });
  }
  if (cmd === "/editname") {
    const studentCode = text.split(/\s+/).slice(1).join("");
    if (!/^[A-Za-z0-9\-/]{3,40}$/.test(studentCode)) {
      await send(chatId, "Send <code>/editname YOUR-STUDENT-ID</code>. Only your full name can be changed.");
      return json({ ok: true });
    }
    const started = await rpc("telegram_begin_name_edit", { _chat: chatId, _sender: sender, _code: studentCode });
    await send(chatId, started ? "Share your <b>own Telegram phone contact</b> using the button below. It must match your registered personal phone, not your emergency contact. Then send your corrected full name. This request expires in 10 minutes.\nሙሉ ስምዎን ለማስተካከል የራስዎን ስልክ ቁጥር ያጋሩ።" : "Unable to start an edit. Check your Student ID or contact the college.", started ? { keyboard: [[{ text: "Share my phone number", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } : undefined);
    return json({ ok: true });
  }
  let contactPhone: string | null = null;
  if (msg.contact) {
    const phone = ownContact(sender, msg.contact);
    const { data: editSession, error: sErr } = await db.from("telegram_name_sessions").select("verified").eq("chat_id", chatId).eq("sender_id", sender).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (sErr) throw sErr;
    if (!editSession) {
      if (!phone) {
        await send(chatId, "⚠️ Please share <b>your own</b> Telegram contact using the button. Other people's contacts are not accepted.\nእባክዎ የራስዎን ስልክ ቁጥር ብቻ ያጋሩ።", SHARE_KB);
        return json({ ok: true });
      }
      contactPhone = phone;
    }
  }
  if (msg.contact && !contactPhone) {
    const phone = ownContact(sender, msg.contact);
    const verified = phone ? await rpc("telegram_verify_name_contact", { _chat: chatId, _sender: sender, _phone: phone }) : false;
    await send(chatId, verified ? "✅ Phone verified. Send your corrected <b>full name</b> now (first, middle and last name). Only your name will change." : "Cannot verify ownership. Share your own Telegram contact matching your registered personal phone. If it differs, contact the college; an emergency contact cannot authorize edits.", verified ? { remove_keyboard: true } : undefined);
    return json({ ok: true });
  }
  if (!cmd && text) {
    const { data: session, error } = await db.from("telegram_name_sessions").select("verified").eq("chat_id", chatId).eq("sender_id", sender).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (error) throw error;
    if (session) {
      if (!session.verified) await send(chatId, "First use the Share my phone number button to verify ownership, or /cancel.");
      else if (!validFullName(text)) await send(chatId, "Enter your full name using letters, spaces, apostrophes or hyphens (2 or more names, up to 100 characters), or /cancel.");
      else {
        const saved = await rpc("telegram_finish_name_edit", { _chat: chatId, _sender: sender, _name: text });
        await send(chatId, saved ? `✅ Your full name is now <b>${esc(text.trim().replace(/\s+/g, " "))}</b>. No other fields were changed. Use /status to check your record.` : "Edit expired or not authorized. Start again with /editname YOUR-STUDENT-ID.", { remove_keyboard: true });
      }
      return json({ ok: true });
    }
  }
  let input = text;
  if (contactPhone) input = contactPhone;
  else if (!text || cmd === "/start") { await send(chatId, WELCOME, SHARE_KB); return Response.json({ ok: true }); }
  if (cmd === "/help") { await send(chatId, HELP); return Response.json({ ok: true }); }
  if (cmd === "/departments") { await send(chatId, DEPARTMENTS); return Response.json({ ok: true }); }
  if (cmd === "/contact") { await send(chatId, CONTACT); return Response.json({ ok: true }); }
  if (cmd === "/website") { await send(chatId, WEBSITE); return Response.json({ ok: true }); }
  if (contactPhone) {
    // verified own-contact lookup
  } else if (cmd === "/status") {
    input = text.split(/\s+/).slice(1).join("");
    if (!input) {
      await send(chatId, STATUS_PROMPT, SHARE_KB);
      return Response.json({ ok: true });
    }
  } else if (cmd) {
    await send(chatId, HELP);
    return Response.json({ ok: true });
  }

  const code = input.replace(/\s+/g, "").toUpperCase().slice(0, 40);
  const digits = code.replace(/[^0-9]/g, "");
  const isPhone = /^\+?[0-9\-]{9,15}$/.test(code) && digits.length >= 9 && digits.length <= 13;
  if (!isPhone && !/^[A-Z0-9\-\/]{3,40}$/.test(code)) {
    await send(chatId, "⚠️ ትክክለኛ የተማሪ መለያ ቁጥር ወይም ስልክ ቁጥር ያስገቡ።\nPlease send a valid Student ID or phone number.");
    return Response.json({ ok: true });
  }

  if (isPhone && !contactPhone) {
    await send(chatId, "🔒 For privacy, typed phone numbers are not accepted. Tap <b>📱 Share My Phone Number</b> below, or send your <b>Student ID</b>.\nለግላዊነት ሲባል የተጻፈ ስልክ ቁጥር አይቀበልም። ከታች ያለውን ቁልፍ ይጫኑ ወይም የተማሪ መለያ ቁጥርዎን ይላኩ።", SHARE_KB);
    return Response.json({ ok: true });
  }

  let profile: { id: string; full_name: string; student_code: string } | null = null;
  const matches = await rpc("telegram_find_students", { _input: code, _phone: isPhone });
    if (matches.length > 1) {
      await send(chatId, `📱 ይህ ስልክ ቁጥር ከአንድ በላይ ተማሪ ጋር ተያይዟል። እባክዎ የተማሪ መለያ ቁጥርዎን ይላኩ።\nThis phone number is linked to more than one student. Please send your <b>Student ID</b> instead.`);
      return Response.json({ ok: true });
    }
  profile = matches[0] ?? null;

  if (!profile) {
    await send(chatId, `🔍 <b>${esc(contactPhone ? "Your phone" : code)}</b> አልተገኘም / not found.\nPlease check your Student ID. If your shared phone finds no record, send your <b>Student ID</b> instead.\nመረጃዎ ካልተገኘ የተማሪ መለያ ቁጥርዎን ይላኩ።`);
    return Response.json({ ok: true });
  }

  const { data: app, error: appError } = await db.from("applications")
    .select("id, status, first_choice, second_choice, third_choice, documents, result_doc_path, program, grade_12_results")
    .eq("user_id", profile.id).maybeSingle();
  if (appError) throw appError;
  const program = app?.program ?? app?.grade_12_results?.personal_info?.program ?? app?.grade_12_results?.program ?? "Not selected";
  const header = `👤 <b>${esc(profile.full_name || "Student")}</b>\n🆔 ${esc(profile.student_code)}\n📚 <b>Program / መርሃ ግብር:</b> ${esc(program)}`;

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
  } catch (error) {
    console.error("Telegram bot request failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Unable to process Telegram request" }, 500);
  }
});
