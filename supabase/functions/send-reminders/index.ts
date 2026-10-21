import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

/** Admin-triggered: push a reminder to every student device whose owner has no application yet. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const cronHeader = req.headers.get("x-cron-secret");
    let isCron = false;
    if (cronHeader) {
      const { data } = await admin.rpc("verify_reminder_cron", { p_secret: cronHeader });
      isCron = data === true;
    }
    if (!isCron) {
      const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
      const { data: { user } } = await admin.auth.getUser(jwt);
      if (!user) return json({ error: "Not signed in" }, 401);
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
      if (!roles?.some((r) => r.role === "admin" || r.role === "sub_admin")) return json({ error: "Not allowed" }, 403);
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const fcmKey = Deno.env.get("FIREBASE_MESSAGING_API_KEY");
    if (!lovableKey || !fcmKey) return json({ error: "Push service not configured" }, 500);

    const { data: tokens } = await admin.from("push_tokens").select("token, user_id");
    const { data: apps } = await admin.from("applications").select("user_id");
    const { data: staff } = await admin.from("user_roles").select("user_id");
    const done = new Set([...(apps ?? []), ...(staff ?? [])].map((a) => a.user_id));
    const targets = (tokens ?? []).filter((t) => !done.has(t.user_id));

    let sent = 0, removed = 0, failed = 0;
    for (const t of targets) {
      const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": fcmKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token: t.token,
            notification: {
              title: "ማመልከቻዎን አላጠናቀቁም / Application not finished",
              body: "እባክዎ ሙሉ ፎርሙን ይሙሉ። Please complete your application form.",
            },
            webpush: { fcm_options: { link: "/application" } },
            data: { path: "/application" },
          },
        }),
      });
      if (res.ok) {
        sent++;
        await admin.from("push_tokens").update({ last_notified_at: new Date().toISOString() }).eq("token", t.token);
      } else {
        const txt = await res.text();
        if (res.status === 404 || txt.includes("UNREGISTERED") || res.status === 400) {
          await admin.from("push_tokens").delete().eq("token", t.token);
          removed++;
        } else { failed++; console.error(`FCM [${res.status}]: ${txt}`); }
      }
    }
    return json({ sent, removed, failed, targets: targets.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
