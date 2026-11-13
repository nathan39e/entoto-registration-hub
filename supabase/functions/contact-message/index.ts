import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { contactSchema, lookupSchema } from "./rules.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Service unavailable");
    const db = createClient(url, key);
    const body = await req.json();
    if (body.action === "lookup") {
      const parsed = lookupSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Invalid conversation link" }, 400);
      const { data, error } = await db.from("contact_submissions").select("id,subject,message,created_at,reply,replied_at").eq("id", parsed.data.id).eq("token_hash", await hash(parsed.data.token)).maybeSingle();
      if (error) throw error;
      return data ? json(data) : json({ error: "Conversation not found" }, 404);
    }
    if (body.action !== "submit") return json({ error: "Unknown action" }, 400);
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Enter a valid name, email, subject and message." }, 400);
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
    const { data, error } = await db.from("contact_submissions").insert({ ...parsed.data, token_hash: await hash(token) }).select("id").single();
    if (error) throw error;
    return json({ id: data.id, token }, 201);
  } catch {
    return json({ error: "Could not process your message. Please try again." }, 500);
  }
});