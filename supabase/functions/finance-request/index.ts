import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { cbeFor } from "../_shared/cbe.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const SITE = "https://tafarimakonnenn.onrender.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovable = Deno.env.get("LOVABLE_API_KEY"), tg = Deno.env.get("TELEGRAM_API_KEY");
    if (!lovable || !tg) return json({ error: "Telegram is not configured" }, 500);
    const db = createClient(url, service, { auth: { persistSession: false } });
    const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ error: "Please sign in" }, 401);
    const { data: roles } = await db.from("user_roles").select("role").eq("user_id", user.id).in("role", ["finance", "admin"]);
    if (!roles?.length) return json({ error: "Finance staff only" }, 403);
    const body = await req.json().catch(() => ({}));
    if (body.action === "notify") {
      const pid = typeof body.payment_id === "string" && /^[0-9a-f-]{36}$/i.test(body.payment_id) ? body.payment_id : null;
      if (!pid) return json({ error: "Invalid payment" }, 400);
      const { data: pay } = await db.from("payments").select("user_id, status, amount").eq("id", pid).maybeSingle();
      if (!pay || !["completed", "rejected"].includes(pay.status ?? "")) return json({ sent: false });
      const [{ data: chat }, { data: p }] = await Promise.all([
        db.from("telegram_student_chats").select("chat_id").eq("user_id", pay.user_id).maybeSingle(),
        db.from("profiles").select("full_name, student_code").eq("id", pay.user_id).maybeSingle(),
      ]);
      if (!chat) return json({ sent: false });
      const name = esc(p?.full_name ?? "");
      const text = pay.status === "completed"
        ? `✅ <b>ክፍያዎ ተረጋግጧል / Payment Verified</b>\n\nውድ ${name}፣ የ ${pay.amount} ብር ክፍያዎ በፋይናንስ ክፍል ተረጋግጧል። እናመሰግናለን!\nDear ${name} (${esc(p?.student_code ?? "")}), your payment of <b>${pay.amount} ETB</b> has been verified by the finance office. Thank you!`
        : `❌ <b>ደረሰኝ ተቀባይነት አላገኘም / Receipt Rejected</b>\n\nውድ ${name}፣ የላኩት ደረሰኝ ሊረጋገጥ አልቻለም። እባክዎ ግልጽ ደረሰኝ እንደገና ይላኩ።\nDear ${name}, your receipt could not be verified. Please send a clear photo of a valid receipt here.`;
      const r = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
        method: "POST", headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": tg, "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat.chat_id, text, parse_mode: "HTML" }),
      });
      if (!r.ok) console.error("Telegram notify failed", r.status, await r.text());
      return json({ sent: r.ok });
    }
    const ids: string[] = Array.isArray(body.user_ids) ? body.user_ids.filter((x: unknown) => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 200) : [];
    if (!ids.length) return json({ error: "Select at least one student" }, 400);
    const [{ data: chats }, { data: profiles }, { data: apps }, { data: paid }] = await Promise.all([
      db.from("telegram_student_chats").select("user_id, chat_id").in("user_id", ids),
      db.from("profiles").select("id, full_name, student_code").in("id", ids),
      db.from("applications").select("user_id, program").in("user_id", ids),
      db.from("payments").select("user_id").in("user_id", ids).eq("status", "completed"),
    ]);
    const paidSet = new Set((paid ?? []).map((p) => p.user_id));
    let sent = 0, unreachable = 0, skipped = 0;
    for (const id of ids) {
      if (paidSet.has(id)) { skipped++; continue; }
      const chat = chats?.find((c) => c.user_id === id); const p = profiles?.find((x) => x.id === id);
      const program = apps?.find((a) => a.user_id === id)?.program ?? "Regular";
      const { account, amount } = cbeFor(program);
      let delivered = false;
      if (chat && p) {
        const text = `💳 <b>የክፍያ ጥያቄ / Payment Request</b>\n\n👤 ${esc(p.full_name)}\n🆔 ${esc(p.student_code)}\n📚 Program: ${esc(program)}\n\n💰 Amount: <b>${amount} ETB</b>\n🏦 Commercial Bank of Ethiopia (CBE)\nAccount: <code>${account}</code>\nTeferi Mekonnen Polytechnic College\n\nPay at any CBE branch or with CBE Birr / Mobile Banking. Write your Student ID as the reason. Then upload the receipt and transaction number at ${SITE}/payment\nክፍያውን ከፈጸሙ በኋላ ደረሰኙን በድረ-ገጹ ላይ ያስገቡ።`;
        const r = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
          method: "POST", headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": tg, "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chat.chat_id, text, parse_mode: "HTML" }),
        });
        delivered = r.ok; if (!r.ok) console.error("Telegram send failed", r.status, await r.text());
      }
      if (delivered) sent++; else unreachable++;
      await db.from("payment_requests").insert({ user_id: id, sent_by: user.id, amount, account, delivered });
    }
    return json({ sent, unreachable, skipped });
  } catch (e) {
    console.error(e); return json({ error: "Could not send payment requests" }, 500);
  }
});
