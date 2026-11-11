import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const CHAPA = "https://api.chapa.co/v1";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const key = () => Deno.env.get("CHAPA_SECRET_KEY")!;
const TX = /^tmpc-[A-Za-z0-9-]{10,60}$/;

// Re-checks the transaction with Chapa itself; never trusts the caller.
async function settle(txRef: string) {
  if (!TX.test(txRef)) return { status: "invalid" };
  const { data: pay } = await admin.from("payments").select("id,amount,status").eq("transaction_id", txRef).maybeSingle();
  if (!pay) return { status: "unknown" };
  if (pay.status === "completed") return { status: "completed" };
  const r = await fetch(`${CHAPA}/transaction/verify/${encodeURIComponent(txRef)}`, { headers: { Authorization: `Bearer ${key()}` } });
  const v = await r.json().catch(() => ({}));
  const d = v?.data;
  if (r.ok && d?.status === "success" && d?.tx_ref === txRef && d?.currency === "ETB" && Number(d?.amount) >= Number(pay.amount)) {
    await admin.from("payments").update({ status: "completed", paid_at: new Date().toISOString() }).eq("id", pay.id).neq("status", "completed");
    return { status: "completed" };
  }
  if (d?.status === "failed") {
    await admin.from("payments").update({ status: "rejected" }).eq("id", pay.id).eq("status", "pending");
    return { status: "failed" };
  }
  return { status: "pending" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  try {
    // Chapa callback (GET) or webhook (POST without auth)
    const cbRef = url.searchParams.get("trx_ref") || url.searchParams.get("tx_ref");
    if (req.method === "GET") return json(cbRef ? await settle(cbRef) : { ok: true });

    const body = await req.json().catch(() => ({}));
    if (!req.headers.get("Authorization") && (body?.tx_ref || body?.trx_ref)) return json(await settle(String(body.tx_ref ?? body.trx_ref)));

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token ?? "");
    if (!user) return json({ error: "Please sign in" }, 401);

    if (body?.action === "verify") {
      const ref = String(body.tx_ref ?? "");
      const { data: own } = await admin.from("payments").select("id").eq("transaction_id", ref).eq("user_id", user.id).maybeSingle();
      if (!own) return json({ error: "Payment not found" }, 404);
      return json(await settle(ref));
    }
    if (body?.action !== "init") return json({ error: "Unknown action" }, 400);
    const origin = String(body.origin ?? "");
    if (!/^https?:\/\/[^\s/]+$/.test(origin)) return json({ error: "Invalid origin" }, 400);

    const [{ data: app }, { data: result }, { data: prior }, { data: prof }] = await Promise.all([
      admin.from("applications").select("status,program").eq("user_id", user.id).maybeSingle(),
      admin.from("psychometric_results").select("id").eq("user_id", user.id).limit(1).maybeSingle(),
      admin.from("payments").select("status,transaction_id,payment_method").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("profiles").select("full_name,email,phone").eq("id", user.id).maybeSingle(),
    ]);
    if (!app || !result || ["waiting_list", "rejected", "pending"].includes(app.status ?? "pending"))
      return json({ error: "Complete an eligible application and the exam before paying." }, 403);
    if (prior?.status === "completed") return json({ error: "Payment already completed." }, 409);
    if (prior?.status === "pending" && prior.payment_method !== "chapa") return json({ error: "Your receipt is already awaiting review." }, 409);

    const amount = app.program === "Extension" || app.program === "Weekend" ? 1700 : 350;
    const txRef = `tmpc-${user.id.slice(0, 8)}-${Date.now()}`;
    const [first, ...rest] = (prof?.full_name ?? "Student").trim().split(/\s+/);
    const phone = /^0[79]\d{8}$/.test(prof?.phone ?? "") ? prof!.phone : undefined;
    const r = await fetch(`${CHAPA}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: String(amount), currency: "ETB", email: prof?.email ?? user.email, first_name: first, last_name: rest.join(" ") || first,
        phone_number: phone, tx_ref: txRef,
        callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/chapa-pay`,
        return_url: `${origin}/payment?tx_ref=${txRef}`,
        customization: { title: "TMPC Registration", description: "Registration fee" },
      }),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out?.data?.checkout_url) { console.error("chapa init", out); return json({ error: "Could not start Chapa payment." }, 502); }
    const { error } = await admin.from("payments").insert({ user_id: user.id, amount, transaction_id: txRef, payment_method: "chapa", status: "pending", program: app.program });
    if (error) throw error;
    return json({ checkout_url: out.data.checkout_url });
  } catch (e) {
    console.error(e);
    return json({ error: "Payment service error" }, 500);
  }
});
