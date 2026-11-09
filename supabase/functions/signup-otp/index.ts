import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Normalize Ethiopian numbers to 2519XXXXXXXX / 2517XXXXXXXX. */
export function msisdn(raw: string): string | null {
  let d = String(raw ?? "").replace(/[^\d]/g, "");
  if (d.startsWith("251")) d = d.slice(3);
  else if (d.startsWith("0")) d = d.slice(1);
  return /^[79]\d{8}$/.test(d) ? `251${d}` : null;
}

async function sha(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const phone = msisdn(body.phone);
    if (!phone) return json({ error: "Enter a valid Ethiopian phone number, such as 0912345678." }, 400);
    const pepper = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (body.action === "send") {
      const since = new Date(Date.now() - 3600_000).toISOString();
      const { data: recent } = await admin.from("signup_phone_otps").select("created_at")
        .eq("phone", phone).gte("created_at", since).order("created_at", { ascending: false });
      if (recent?.[0] && Date.now() - new Date(recent[0].created_at).getTime() < 60_000)
        return json({ error: "Please wait a minute before requesting another code." }, 429);
      if ((recent?.length ?? 0) >= 5) return json({ error: "Too many codes requested. Try again in an hour." }, 429);

      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
      const key = Deno.env.get("SMSETHIOPIA_API_KEY");
      if (!key) return json({ error: "SMS service is not configured." }, 500);
      const res = await fetch("https://smsethiopia.com/api/sms/send", {
        method: "POST",
        headers: { KEY: key, "Content-Type": "application/json" },
        body: JSON.stringify({ msisdn: phone, text: `Tafari Makonnen Polytechnic College verification code: ${code}. Valid for 5 minutes.` }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out?.sent === false) {
        console.error("sms send failed", res.status, JSON.stringify(out));
        return json({ error: "Could not send the SMS. Please try again." }, 502);
      }
      await admin.from("signup_phone_otps").insert({
        phone, code_hash: await sha(`${phone}:${code}:${pepper}`),
        expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      });
      return json({ ok: true });
    }

    if (body.action === "verify_signup") {
      const code = String(body.code ?? "").trim();
      const email = String(body.email ?? "").trim();
      const password = String(body.password ?? "");
      const fullName = String(body.full_name ?? "").trim().slice(0, 120);
      const redirect = String(body.redirect ?? "");
      if (!/^\d{6}$/.test(code)) return json({ error: "Enter the 6-digit code." }, 400);
      if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6 || !fullName)
        return json({ error: "Please complete all signup fields." }, 400);

      const { data: row } = await admin.from("signup_phone_otps").select("*")
        .eq("phone", phone).is("used_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!row || new Date(row.expires_at) < new Date()) return json({ error: "Code expired. Request a new one." }, 400);
      if (row.attempts >= 5) return json({ error: "Too many wrong attempts. Request a new code." }, 400);
      if (row.code_hash !== await sha(`${phone}:${code}:${pepper}`)) {
        await admin.from("signup_phone_otps").update({ attempts: row.attempts + 1 }).eq("id", row.id);
        return json({ error: "Incorrect code." }, 400);
      }

      const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
      const { data, error } = await anon.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, phone: `+${phone}`, phone_verified: true }, emailRedirectTo: redirect || undefined },
      });
      if (error) return json({ error: error.message }, 400);
      await admin.from("signup_phone_otps").update({ used_at: new Date().toISOString() }).eq("id", row.id);
      return json({ ok: true, session: data.session });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Server error" }, 500);
  }
});
