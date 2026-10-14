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
    const isSub = roles?.some((r) => r.role === "sub_admin" || r.role === "department_head");
    const body = await req.json();
    const action = body.action;

    if (action === "upload_student_document") {
      if (!isAdmin && !isSub) return json({ error: "Not allowed" }, 403);
      const id = str(body.id, 64);
      const name = str(body.name, 24);
      const allowed = ["photo", "grade12", "grade8", "transcript", "manualForm"];
      const mime = str(body.mime, 40);
      if (!allowed.includes(name) || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(mime) ||
          ((name === "photo" || name === "grade12") && mime === "application/pdf"))
        return json({ error: "Unsupported document type" }, 400);
      const { data: owner } = await admin.from("profiles").select("registered_by").eq("id", id).maybeSingle();
      if (!owner || (!isAdmin && owner.registered_by !== user.id)) return json({ error: "Not allowed for this student" }, 403);
      const encoded = typeof body.content === "string" ? body.content : "";
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length > 7_000_000 || encoded.length < 4)
        return json({ error: "Invalid or oversized document" }, 400);
      const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
      if (bytes.length > 5 * 1024 * 1024) return json({ error: "Document exceeds 5MB" }, 400);
      const ext = mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const path = `${id}/${name}-${crypto.randomUUID()}.${ext}`;
      const { error } = await admin.storage.from("result-docs").upload(path, bytes, { contentType: mime });
      if (error) return json({ error: error.message }, 400);
      return json({ path });
    }

    if (action === "register_student") {
      if (!isAdmin && !isSub) return json({ error: "Not allowed" }, 403);
      const full_name = str(body.full_name, 100), email = str(body.email, 255).toLowerCase();
      const password = typeof body.password === "string" ? body.password : "";
      if (!full_name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8)
        return json({ error: "Name, valid email and a password of at least 8 characters are required." }, 400);
      let id: string;
      const { data: created, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name },
      });
      if (error) {
        // A previous attempt may have created the account but failed later (e.g. upload). Let the same staff retry.
        const { data: prev } = await admin.from("profiles").select("id, registered_by").ilike("email", email).maybeSingle();
        const { data: prevApp } = prev ? await admin.from("applications").select("id").eq("user_id", prev.id).maybeSingle() : { data: null };
        if (!prev || prevApp || (prev.registered_by && prev.registered_by !== user.id && !isAdmin))
          return json({ error: /already/i.test(error.message) ? "A student with this email already exists." : error.message }, 400);
        id = prev.id;
        await admin.auth.admin.updateUserById(id, { password, user_metadata: { full_name } });
        await admin.from("profiles").update({ full_name }).eq("id", id);
      } else id = created.user.id;
      await admin.from("profiles").update({ phone: str(body.phone, 20) || null, registered_by: user.id, exam_required: true }).eq("id", id);
      const choices = [str(body.choice1), str(body.choice2), str(body.choice3)];
      if (choices.every(Boolean)) {
        await admin.from("applications").insert({
          user_id: id, first_choice: choices[0], second_choice: choices[1], third_choice: choices[2],
          grade_12_results: { score: Number(String(body.grade12 ?? "").replace(",", ".")) || null, program: str(body.program, 20), registered_by_staff: true, personal_info: { phone: str(body.phone, 20), program: str(body.program, 20) } },
        });
      }
      const { data: prof } = await admin.from("profiles").select("student_code").eq("id", id).maybeSingle();
      return json({ ok: true, id, student_code: prof?.student_code });
    }

    if (action === "staff_application") {
      if (!isAdmin && !isSub) return json({ error: "Not allowed" }, 403);
      const id = str(body.id, 64);
      const { data: p } = await admin.from("profiles").select("registered_by").eq("id", id).maybeSingle();
      if (!p || (!isAdmin && p.registered_by !== user.id)) return json({ error: "Not allowed for this student" }, 403);
      const a = body.application ?? {};
      const docs = a.documents ?? {};
      for (const v of Object.values(docs)) {
        if (typeof v !== "string" || !v.startsWith(`${id}/`)) return json({ error: "Invalid document path" }, 400);
      }
      const { error } = await admin.from("applications").insert({
        user_id: id, grade_12_results: a.grade_12_results ?? {},
        first_choice: str(a.first_choice, 300), second_choice: str(a.second_choice, 300), third_choice: str(a.third_choice, 300),
        result_doc_path: docs.grade12 ?? null, documents: docs,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (!isAdmin) return json({ error: "Admins only" }, 403);

    if (action === "create_sub_admin") {
      const full_name = str(body.full_name, 100), email = str(body.email, 255).toLowerCase();
      const password = typeof body.password === "string" ? body.password : "";
      if (!full_name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8)
        return json({ error: "Name, valid email and a password of at least 8 characters are required." }, 400);
      const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
      if (error) return json({ error: error.message }, 400);
      const id = created.user.id;
      await admin.from("user_roles").delete().eq("user_id", id).eq("role", "student");
      await admin.from("user_roles").upsert({ user_id: id, role: "sub_admin" }, { onConflict: "user_id,role" });
      return json({ ok: true });
    }

    if (action === "assign_department_head") {
      const department = str(body.department, 100);
      if (!department) return json({ error: "Select a department." }, 400);
      if (body.remove) {
        const { data: h } = await admin.from("department_heads").select("user_id").eq("department", department).maybeSingle();
        if (h) {
          await admin.from("department_heads").delete().eq("user_id", h.user_id);
          await admin.from("user_roles").delete().eq("user_id", h.user_id).eq("role", "department_head");
        }
        return json({ ok: true });
      }
      const { data: taken } = await admin.from("department_heads").select("user_id").eq("department", department).maybeSingle();
      if (taken) return json({ error: "This department already has a head. Remove them first." }, 400);
      const email = str(body.email, 255).toLowerCase();
      let id: string;
      if (body.password) {
        const full_name = str(body.full_name, 100);
        const password = typeof body.password === "string" ? body.password : "";
        if (!full_name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8)
          return json({ error: "Name, valid email and a password of at least 8 characters are required." }, 400);
        const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
        if (error) return json({ error: error.message }, 400);
        id = created.user.id;
        await admin.from("user_roles").delete().eq("user_id", id).eq("role", "student");
      } else {
        const { data: p } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
        if (!p) return json({ error: "No account found with that email." }, 404);
        id = p.id;
      }
      const { data: already } = await admin.from("department_heads").select("department").eq("user_id", id).maybeSingle();
      if (already) return json({ error: `This person already heads ${already.department}.` }, 400);
      const { error: e1 } = await admin.from("department_heads").insert({ user_id: id, department });
      if (e1) return json({ error: e1.message }, 400);
      await admin.from("user_roles").upsert({ user_id: id, role: "department_head" }, { onConflict: "user_id,role" });
      return json({ ok: true });
    }

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
