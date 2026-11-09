import { createClient } from "npm:@supabase/supabase-js@2";

const TOKEN = Deno.env.get("TELEGRAM_ADMIN_BOT_TOKEN") ?? "";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const STAFF_ROLES = ["admin", "sub_admin"];
const SESSION_HOURS = 12;

async function deriveSecret(key: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`telegram-admin-webhook:${key}`));
  return btoa(String.fromCharCode(...new Uint8Array(d))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const phoneKey = (p?: string | null) => {
  const d = String(p ?? "").replace(/\D/g, "");
  return /^(0|251|00251)?[79]\d{8}$/.test(d) ? d.slice(-9) : null;
};

async function tg(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!r.ok) console.error(method, r.status, await r.text());
}
const send = async (chat: number, text: string, reply_markup?: unknown) => {
  for (let i = 0; i < text.length; i += 3900)
    await tg("sendMessage", { chat_id: chat, text: text.slice(i, i + 3900), parse_mode: "HTML", disable_web_page_preview: true, ...(i === 0 && reply_markup ? { reply_markup } : {}) });
};

const LOGIN_KB = { keyboard: [[{ text: "📱 Share my phone to sign in", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true };
const MENU_KB = { keyboard: [["/stats", "/today"], ["/pending", "/help"]], resize_keyboard: true };
const HELP = "<b>Admin bot commands</b>\n/stats — totals by department, gender and status\n/today — new registrations today\n/pending — payments and documents waiting for review\n/find TEXT — search a student by Student ID, name or phone\n/logout — sign out of this chat\n\nYou can also just type a Student ID, name or phone number.";

async function isActiveStaff(uid: string) {
  const { data: roles } = await db.from("user_roles").select("role").eq("user_id", uid).in("role", STAFF_ROLES);
  if (!roles?.length) return false;
  const { data } = await db.auth.admin.getUserById(uid);
  const banned = data?.user?.banned_until && new Date(data.user.banned_until) > new Date();
  return !banned;
}

async function signIn(chat: number, from: number, phone: string) {
  const key = phoneKey(phone);
  if (!key) return null;
  const { data: staff } = await db.from("user_roles").select("user_id").in("role", STAFF_ROLES);
  const ids = [...new Set((staff ?? []).map((r) => r.user_id))];
  if (!ids.length) return null;
  const { data: profs } = await db.from("profiles").select("id, full_name, phone").in("id", ids);
  const matches = (profs ?? []).filter((p) => phoneKey(p.phone) === key);
  if (matches.length !== 1 || !(await isActiveStaff(matches[0].id))) return null;
  await db.from("telegram_admin_sessions").upsert({
    chat_id: chat, telegram_user_id: from, staff_id: matches[0].id,
    expires_at: new Date(Date.now() + SESSION_HOURS * 3600_000).toISOString(),
  });
  return matches[0];
}

async function session(chat: number, from: number) {
  const { data } = await db.from("telegram_admin_sessions").select("*").eq("chat_id", chat).maybeSingle();
  if (!data || data.telegram_user_id !== from || new Date(data.expires_at) < new Date()) return null;
  if (!(await isActiveStaff(data.staff_id))) { await db.from("telegram_admin_sessions").delete().eq("chat_id", chat); return null; }
  return data;
}

async function allRows<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) return out;
  }
}

type App = { id: string; user_id: string; status: string | null; first_choice: string; second_choice: string; third_choice: string; program: string | null; submitted_at: string; documents: Record<string, unknown> | null; grade_12_results: { personal_info?: Record<string, unknown>; total?: unknown } | null };
const APP_COLS = "id,user_id,status,first_choice,second_choice,third_choice,program,submitted_at,documents,grade_12_results";
const gender = (a: App) => String(a.grade_12_results?.personal_info?.gender ?? "").toLowerCase();
const hasMainDoc = (a: App) => !!(a.documents?.grade12 || a.documents?.degree || a.documents?.coc);
const tally = (xs: string[]) => Object.entries(xs.reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);

async function stats() {
  const [apps, roles] = await Promise.all([allRows<App>("applications", APP_COLS), allRows<{ user_id: string; role: string }>("user_roles", "user_id,role")]);
  const staff = new Set(roles.filter((r) => r.role !== "student").map((r) => r.user_id));
  const students = new Set(roles.filter((r) => r.role === "student" && !staff.has(r.user_id)).map((r) => r.user_id));
  const m = apps.filter((a) => gender(a) === "male").length, f = apps.filter((a) => gender(a) === "female").length;
  let t = `📊 <b>Student statistics</b>\nSigned up: <b>${students.size}</b>\nFilled the form: <b>${apps.length}</b>\nSign-up only: <b>${Math.max(students.size - apps.length, 0)}</b>\n\n👤 Male: <b>${m}</b> · Female: <b>${f}</b>${apps.length - m - f ? ` · Not given: ${apps.length - m - f}` : ""}\n\n<b>By status</b>\n`;
  t += tally(apps.map((a) => a.status ?? "pending")).map(([k, v]) => `• ${esc(k.replace("_", " "))}: ${v}`).join("\n");
  t += "\n\n<b>By 1st choice department</b>\n" + tally(apps.map((a) => a.first_choice)).map(([k, v]) => `• ${esc(k)}: ${v}`).join("\n");
  t += "\n\n<b>By program</b>\n" + tally(apps.map((a) => a.program ?? "Not set")).map(([k, v]) => `• ${esc(k)}: ${v}`).join("\n");
  return t;
}

const addisDayStart = () => {
  const now = new Date(Date.now() + 3 * 3600_000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 3 * 3600_000).toISOString();
};

async function today() {
  const since = addisDayStart();
  const [{ data: profs }, { data: apps }] = await Promise.all([
    db.from("profiles").select("id,full_name,student_code,phone,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(200),
    db.from("applications").select("user_id,first_choice").gte("submitted_at", since),
  ]);
  const applied = new Map((apps ?? []).map((a) => [a.user_id, a.first_choice]));
  let t = `🆕 <b>Today (Addis Ababa time)</b>\nNew sign-ups: <b>${profs?.length ?? 0}</b> · Forms submitted: <b>${apps?.length ?? 0}</b>\n`;
  for (const p of profs ?? []) t += `\n• ${esc(p.full_name)} — <code>${esc(p.student_code)}</code>${applied.has(p.id) ? ` ✅ ${esc(applied.get(p.id))}` : " (sign-up only)"}`;
  return t;
}

async function pending() {
  const [{ data: pays }, apps] = await Promise.all([
    db.from("payments").select("user_id,amount,transaction_id,created_at,status").not("status", "in", "(completed,rejected,failed)").order("created_at").limit(100),
    allRows<App>("applications", APP_COLS),
  ]);
  const noDocs = apps.filter((a) => !hasMainDoc(a) || !a.documents?.photo);
  const ids = [...new Set([...(pays ?? []).map((p) => p.user_id), ...noDocs.slice(0, 60).map((a) => a.user_id)])];
  const { data: profs } = ids.length ? await db.from("profiles").select("id,full_name,student_code").in("id", ids) : { data: [] };
  const name = new Map((profs ?? []).map((p) => [p.id, `${esc(p.full_name)} (<code>${esc(p.student_code)}</code>)`]));
  let t = `💳 <b>Payments waiting for review: ${pays?.length ?? 0}</b>\n`;
  t += (pays ?? []).map((p) => `• ${name.get(p.user_id) ?? "Unknown"} — ${p.amount} ETB${p.transaction_id ? ` · Ref ${esc(p.transaction_id)}` : ""}`).join("\n") || "None 🎉";
  t += `\n\n📄 <b>Applications missing documents: ${noDocs.length}</b>\n`;
  t += noDocs.slice(0, 60).map((a) => {
    const miss = [!hasMainDoc(a) && "Grade 12/Degree/COC", !a.documents?.photo && "photo"].filter(Boolean).join(", ");
    return `• ${name.get(a.user_id) ?? "Unknown"} — missing ${miss}`;
  }).join("\n") || "None 🎉";
  if (noDocs.length > 60) t += `\n…and ${noDocs.length - 60} more`;
  return t;
}

async function find(q: string) {
  q = q.trim().slice(0, 80);
  if (q.length < 2) return "Send a Student ID, name or phone number.";
  let profs: { id: string; full_name: string; student_code: string; phone: string | null; email: string }[] = [];
  const key = phoneKey(q);
  if (key) {
    const all = await allRows<typeof profs[number]>("profiles", "id,full_name,student_code,phone,email");
    const apps = await allRows<App>("applications", APP_COLS);
    const emerg = new Set(apps.filter((a) => phoneKey(String(a.grade_12_results?.personal_info?.emergencyPhone ?? "")) === key).map((a) => a.user_id));
    profs = all.filter((p) => phoneKey(p.phone) === key || emerg.has(p.id));
  } else {
    const safe = q.replace(/[%_,()*]/g, " ").trim();
    const { data } = await db.from("profiles").select("id,full_name,student_code,phone,email")
      .or(`student_code.ilike.${safe},full_name.ilike.%${safe}%`).limit(10);
    profs = data ?? [];
  }
  if (!profs.length) return `🔍 No student found for <b>${esc(q)}</b>.`;
  const ids = profs.slice(0, 5).map((p) => p.id);
  const [{ data: apps }, { data: places }, { data: pays }] = await Promise.all([
    db.from("applications").select(APP_COLS).in("user_id", ids),
    db.from("department_placements").select("user_id,current_department,decision,placed_department,exam_score").in("user_id", ids),
    db.from("payments").select("user_id,amount,status").in("user_id", ids),
  ]);
  const out = profs.slice(0, 5).map((p) => {
    const a = (apps as App[] | null)?.find((x) => x.user_id === p.id);
    const pl = places?.find((x) => x.user_id === p.id);
    const pi = a?.grade_12_results?.personal_info ?? {};
    const pay = pays?.filter((x) => x.user_id === p.id) ?? [];
    let t = `👤 <b>${esc(p.full_name)}</b>\n🆔 <code>${esc(p.student_code)}</code>\n📞 ${esc(p.phone ?? "—")} · ✉️ ${esc(p.email)}`;
    if (!a) return t + "\n⚠️ Signed up only — no application form yet.";
    t += `\n⚧ ${esc(pi.gender ?? "—")} · 🎓 ${esc(a.program ?? "—")} · Grade 12: ${esc(a.grade_12_results?.total ?? pi.total ?? "—")}`;
    t += `\n🏫 1) ${esc(a.first_choice)}\n     2) ${esc(a.second_choice)}\n     3) ${esc(a.third_choice)}`;
    t += `\n📌 Status: <b>${esc((a.status ?? "pending").replace("_", " "))}</b>`;
    if (pl) t += `\n🧾 Dept: ${esc(pl.current_department)} · Decision: ${esc(pl.decision)}${pl.placed_department ? ` → ${esc(pl.placed_department)}` : ""}${pl.exam_score != null ? ` · Exam ${pl.exam_score}` : ""}`;
    const d = a.documents ?? {};
    t += `\n📄 ${d.grade12 ? "✅" : "❌"} Grade 12 ${d.degree ? "✅" : "▫️"} Degree ${d.coc ? "✅" : "▫️"} COC ${d.grade8 ? "✅" : "❌"} Grade 8 ${d.photo ? "✅" : "❌"} Photo`;
    t += `\n💳 ${pay.length ? pay.map((x) => `${x.amount} ETB (${esc(x.status)})`).join(", ") : "No payment"}`;
    if (pi.emergencyName) t += `\n🚨 Emergency: ${esc(pi.emergencyName)} ${esc(pi.emergencyPhone ?? "")}`;
    return t;
  });
  return (profs.length > 5 ? `Showing 5 of ${profs.length} matches — be more specific.\n\n` : "") + out.join("\n\n");
}

Deno.serve(async (req) => {
  if (!TOKEN) return new Response("not configured", { status: 500 });
  if (req.method === "GET" && new URL(req.url).searchParams.get("setup") === "1") {
    // Idempotent: points the bot at this function and sets its menu.
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-admin-bot`;
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, secret_token: await deriveSecret(TOKEN), allowed_updates: ["message"] }) });
    await tg("setMyCommands", { commands: [
      { command: "stats", description: "Totals by department, gender, status" },
      { command: "today", description: "New registrations today" },
      { command: "pending", description: "Payments & documents waiting" },
      { command: "find", description: "Search student by ID, name or phone" },
      { command: "help", description: "Show commands" },
      { command: "logout", description: "Sign out" },
    ] });
    const me = await (await fetch(`https://api.telegram.org/bot${TOKEN}/getMe`)).json();
    return Response.json({ webhook: (await r.json()).ok, bot: me?.result?.username });
  }
  if (req.method !== "POST") return new Response("ok");
  if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== await deriveSecret(TOKEN)) return new Response("Unauthorized", { status: 401 });
  const upd = await req.json().catch(() => ({}));
  const msg = upd.message;
  if (!msg?.chat?.id || !msg.from?.id) return Response.json({ ok: true });
  const chat = msg.chat.id as number, from = msg.from.id as number;
  try {
    if (msg.chat.type !== "private") { await send(chat, "This bot only works in a private chat."); return Response.json({ ok: true }); }
    if (msg.contact) {
      if (msg.contact.user_id !== from) { await send(chat, "Please share <b>your own</b> contact using the button.", LOGIN_KB); return Response.json({ ok: true }); }
      const who = await signIn(chat, from, msg.contact.phone_number);
      await send(chat, who ? `✅ Welcome, <b>${esc(who.full_name)}</b>. You are signed in for ${SESSION_HOURS} hours.\n\n${HELP}` : "⛔ This phone number is not linked to an active admin or sub-admin account. Add your phone to your staff profile on the website first.", who ? MENU_KB : LOGIN_KB);
      return Response.json({ ok: true });
    }
    const text = String(msg.text ?? "").trim();
    const s = await session(chat, from);
    if (!s) { await send(chat, "🔐 <b>Staff sign-in required.</b>\nTap the button below to share your Telegram phone number. It must match the phone on your admin or sub-admin account.", LOGIN_KB); return Response.json({ ok: true }); }
    const [cmd, ...rest] = text.split(/\s+/);
    const c = cmd.toLowerCase().replace(/@\w+$/, "");
    if (c === "/logout") { await db.from("telegram_admin_sessions").delete().eq("chat_id", chat); await send(chat, "Signed out.", { remove_keyboard: true }); }
    else if (c === "/start" || c === "/help") await send(chat, HELP, MENU_KB);
    else if (c === "/stats") await send(chat, await stats());
    else if (c === "/today") await send(chat, await today());
    else if (c === "/pending") await send(chat, await pending());
    else if (c === "/find") await send(chat, await find(rest.join(" ")));
    else if (text && !text.startsWith("/")) await send(chat, await find(text));
    else await send(chat, HELP, MENU_KB);
  } catch (e) {
    console.error(e);
    await send(chat, "Something went wrong. Please try again.");
  }
  return Response.json({ ok: true });
});
