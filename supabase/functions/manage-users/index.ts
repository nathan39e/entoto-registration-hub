import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Not signed in" }, 401);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r) => r.role === "admin");
    const isSub = roles?.some((r) => r.role === "sub_admin");
    const body = await req.json();
    const action = body.action;

    if (action === "register_student") {
      if (!isAdmin && !isSub) return json({ error: "Not allowed" }, 403);
      const full_name = str(body.full_name, 100), email = str(body.email, 255).toLowerCase();
      const password = typeof body.password === "string" ? body.password : "";
      if (!full_name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8)
        return json({ error: "Name, valid email and a password of at least 8 characters are required." }, 400);
      const { data: created, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name },
      });
      if (error) return json({ error: error.message }, 400);
      const id = created.user.id;
      await admin.from("profiles").update({ phone: str(body.phone, 20) || null, registered_by: user.id, exam_required: true }).eq("id", id);
      const choices = [str(body.choice1), str(body.choice2), str(body.choice3)];
      if (choices.every(Boolean)) {
        await admin.from("applications").insert({
          user_id: id, first_choice: choices[0], second_choice: choices[1], third_choice: choices[2],
          grade_12_results: { score: Number(body.grade12) || null, program: str(body.program, 20), registered_by_staff: true, personal_info: { phone: str(body.phone, 20), program: str(body.program, 20) } },
        });
      }
      const { data: prof } = await admin.from("profiles").select("student_code").eq("id", id).maybeSingle();
      return json({ ok: true, student_code: prof?.student_code });
    }

    if (!isAdmin) return json({ error: "Admins only" }, 403);

    if (action === "update_student") {
      const id = str(body.id, 64);
      const patch: Record<string, unknown> = { full_name: str(body.full_name, 100), phone: str(body.phone, 20) || null };
      const email = str(body.email, 255).toLowerCase();
      if (email) {
        const { error } = await admin.auth.admin.updateUserById(id, { email, email_confirm: true });
        if (error) return json({ error: error.message }, 400);
        patch.email = email;
      }
      const { error } = await admin.from("profiles").update(patch).eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "delete_student") {
      const id = str(body.id, 64);
      if (id === user.id) return json({ error: "You can't delete yourself." }, 400);
      for (const t of ["applications", "payments", "psychometric_results", "portfolios", "user_roles"]) {
        await admin.from(t).delete().eq("user_id", id);
      }
      await admin.from("profiles").delete().eq("id", id);
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_sub_admin") {
      const email = str(body.email, 255).toLowerCase();
      const { data: p } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
      if (!p) return json({ error: "No account found with that email. They must sign up first." }, 404);
      if (body.remove) await admin.from("user_roles").delete().eq("user_id", p.id).eq("role", "sub_admin");
      else await admin.from("user_roles").upsert({ user_id: p.id, role: "sub_admin" }, { onConflict: "user_id,role" });
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error" }, 500);
  }
});
