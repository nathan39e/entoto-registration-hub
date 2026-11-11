import { createClient } from "npm:@supabase/supabase-js@2";
import { canEditDepartments, canAttachManualForm, validManualForm, canCreateAdmin, canManageCreatedAdmin, canManageAdmin, canEditStudentForm, canSaveStudentChoices } from "./record-rules.ts";
import { DEPARTMENT_FIELDS } from "./departments.ts";

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
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return json({ error: "Service unavailable" }, 500);
    const admin = createClient(url, key);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Not signed in" }, 401);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r) => r.role === "admin");
    const isSub = roles?.some((r) => r.role === "sub_admin" || r.role === "department_head");
    const body = await req.json();
    const action = body.action;
    const roleNames = (roles ?? []).map((r) => r.role);

    if (action === "set_department_edit_permission") {
      if (!isAdmin) return json({ error: "Admins only" }, 403);
      const id = str(body.id, 64);
      if (typeof body.allowed !== "boolean") return json({ error: "Select allow or deny" }, 400);
      const { data: sub } = await admin.from("user_roles").select("user_id").eq("user_id", id).eq("role", "sub_admin").maybeSingle();
      if (!sub) return json({ error: "Select a sub-admin" }, 400);
      const { error } = await admin.from("staff_permissions").upsert({ user_id: id, can_edit_departments: body.allowed, updated_by: user.id, updated_at: new Date().toISOString() });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "edit_student_choices") {
      const { data: permission } = await admin.from("staff_permissions").select("can_edit_departments").eq("user_id", user.id).maybeSingle();
      if (!canEditDepartments(roleNames, permission?.can_edit_departments === true)) return json({ error: "Your admin has not granted permission to edit department choices." }, 403);
      const choices = Array.isArray(body.choices) ? body.choices : [];
      const fields = Array.isArray(body.fields) ? body.fields : [];
      // Use the same department catalog as the application form.
      const catalog: Record<string, string[]> = DEPARTMENT_FIELDS;
      if (choices.length !== 3 || fields.length !== 3 || new Set(choices).size !== 3 || choices.some((d, i) => typeof d !== "string" || !catalog[d]?.includes(fields[i]))) return json({ error: "Choose three different departments and a valid occupation for each." }, 400);
      const { error } = await admin.rpc("edit_student_choices", { _actor: user.id, _student: str(body.id, 64), _choices: choices, _fields: fields });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "attach_manual_form") {
      if (!canAttachManualForm(roleNames)) return json({ error: "Admins and sub-admins only" }, 403);
      const id = str(body.id, 64);
      const { data: staff } = await admin.from("user_roles").select("role").eq("user_id", id).in("role", ["admin", "sub_admin", "department_head"]);
      if (staff?.length) return json({ error: "Select a student account" }, 400);
      const { data: application, error: lookupError } = await admin.from("applications").select("id, documents").eq("user_id", id).maybeSingle();
      if (lookupError || !application) return json({ error: "Student has no application" }, 400);
      if (!isAdmin) {
        // Sub-admins may only attach forms for students they registered themselves.
        const { data: owner } = await admin.from("profiles").select("registered_by").eq("id", id).maybeSingle();
        if (owner?.registered_by !== user.id) return json({ error: "You can only attach forms for students you registered." }, 403);
      }
      const mime = str(body.mime, 40);
      const encoded = typeof body.content === "string" ? body.content : "";
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length > 7_000_000 || encoded.length < 4) return json({ error: "Invalid or oversized document" }, 400);
      const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
      if (!validManualForm({ type: mime, size: bytes.length })) return json({ error: "Use a JPG, PNG, WebP or PDF under 5MB" }, 400);
      const ext = mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const path = `${id}/manualForm-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await admin.storage.from("result-docs").upload(path, bytes, { contentType: mime });
      if (uploadError) return json({ error: uploadError.message }, 400);
      const { error } = await admin.from("applications").update({ documents: { ...(application.documents ?? {}), manualForm: path } }).eq("id", application.id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, path });
    }

    if (action === "upload_student_document") {
      if (!isAdmin && !isSub) return json({ error: "Not allowed" }, 403);
      const id = str(body.id, 64);
      const name = str(body.name, 24);
      const allowed = ["photo", "grade12", "grade8", "transcript", "manualForm", "degree", "coc"];
      const mime = str(body.mime, 40);
      if (!allowed.includes(name) || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(mime) ||
          ((name === "photo" || name === "grade12") && mime === "application/pdf"))
        return json({ error: "Unsupported document type" }, 400);
      const { data: owner } = await admin.from("profiles").select("registered_by").eq("id", id).maybeSingle();
      const editing = body.editing === true && canEditStudentForm(roleNames);
      if (!owner || (!isAdmin && owner.registered_by !== user.id && !editing)) return json({ error: "Not allowed for this student" }, 403);
      const { data: targetRoles, error: targetError } = await admin.from("user_roles").select("role").eq("user_id", id).in("role", ["admin", "sub_admin", "department_head"]);
      if (targetError || targetRoles?.length) return json({ error: "Select a student account" }, 403);
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
        const { data: previousStaff } = prev ? await admin.from("user_roles").select("role").eq("user_id", prev.id).in("role", ["admin", "sub_admin", "department_head"]) : { data: null };
        if (previousStaff?.length) return json({ error: "This email belongs to a staff account." }, 400);
        const { data: prevApp } = prev ? await admin.from("applications").select("id").eq("user_id", prev.id).maybeSingle() : { data: null };
        if (!prev || prevApp || (prev.registered_by && prev.registered_by !== user.id && !isAdmin))
          return json({ error: /already/i.test(error.message) ? "A student with this email already exists." : /weak|pwned|leak|guess/i.test(error.message) ? "This password is too common. Use the generated password or choose a stronger one (letters, numbers and a symbol)." : error.message }, 400);
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
        const ok = (typeof v === "string" && v.startsWith(`${id}/`)) ||
          (Array.isArray(v) && v.length > 0 && v.every((p) => typeof p === "string" && p.startsWith(`${id}/`)));
        if (!ok) return json({ error: "Invalid document path" }, 400);
      }
      const { error } = await admin.from("applications").insert({
        user_id: id, grade_12_results: a.grade_12_results ?? {},
        first_choice: str(a.first_choice, 300), second_choice: str(a.second_choice, 300), third_choice: str(a.third_choice, 300),
        result_doc_path: docs.grade12 ?? null, documents: docs,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "update_student_application") {
      if (!canEditStudentForm(roleNames)) return json({ error: "Admins and sub-admins only" }, 403);
      const id = str(body.id, 64);
      const [{ data: targetRoles, error: rolesError }, { data: application }, { data: permission }] = await Promise.all([
        admin.from("user_roles").select("role").eq("user_id", id).in("role", ["admin", "sub_admin", "department_head"]),
        admin.from("applications").select("first_choice,second_choice,third_choice").eq("user_id", id).maybeSingle(),
        admin.from("staff_permissions").select("can_edit_departments").eq("user_id", user.id).maybeSingle(),
      ]);
      if (rolesError || targetRoles?.length || !application) return json({ error: "Select a student with an application" }, 403);
      const choices = Array.isArray(body.choices) ? body.choices : [];
      const fields = Array.isArray(body.fields) ? body.fields : [];
      if (choices.length !== 3 || fields.length !== 3 || new Set(choices).size !== 3 || choices.some((d, i) => typeof d !== "string" || !DEPARTMENT_FIELDS[d]?.includes(fields[i]))) return json({ error: "Choose three different departments and valid occupations" }, 400);
      if (!canSaveStudentChoices(roleNames, permission?.can_edit_departments === true, [application.first_choice, application.second_choice, application.third_choice], choices.map((d, i) => `${d} — ${fields[i]}`))) return json({ error: "Your admin has not granted permission to edit department choices." }, 403);
      if (!body.personal || typeof body.personal !== "object" || Array.isArray(body.personal)) return json({ error: "Invalid student form" }, 400);
      const personal = Object.fromEntries(Object.entries(body.personal).map(([k, v]) => [k, str(typeof v === "number" ? String(v) : v, 300)]));
      const required = ["firstName", "middleName", "lastName", "email", "phone", "dob", "gender", "country", "region", "city", "subcity", "wereda", "kebele", "houseNumber", "emergencyName", "emergencyRelation", "emergencyPhone", "emergencyAddress", "grade12Year", "program"];
      const score = Number(body.score);
      if (required.some((k) => !personal[k]) || !/^\S+@\S+\.\S+$/.test(personal.email) || !/^\+?[0-9]{9,15}$/.test(personal.phone) || !/^\+?[0-9]{9,15}$/.test(personal.emergencyPhone) || !Number.isFinite(score) || score < 0 || score > 700) return json({ error: "Complete the required fields with valid marks, email and phone numbers." }, 400);
      const documents = body.documents ?? {};
      if (typeof documents !== "object" || Array.isArray(documents)) return json({ error: "Invalid documents" }, 400);
      for (const [name, value] of Object.entries(documents)) {
        if (!["photo", "grade12", "grade8", "transcript", "transcripts", "manualForm", "degree", "coc"].includes(name)) return json({ error: "Invalid document" }, 400);
        const paths = Array.isArray(value) ? value : [value];
        if (!paths.length || paths.some((p) => typeof p !== "string" || !p.startsWith(`${id}/`) || p.includes(".."))) return json({ error: "Invalid document path" }, 400);
      }
      const { data: account, error: accountError } = await admin.auth.admin.getUserById(id);
      if (accountError || !account.user) return json({ error: "Student account not found" }, 400);
      if (account.user.email?.toLowerCase() !== personal.email.toLowerCase()) {
        const { error } = await admin.auth.admin.updateUserById(id, { email: personal.email });
        if (error) return json({ error: error.message }, 400);
      }
      const { error } = await admin.rpc("update_student_application", { _actor: user.id, _student: id, _personal: personal, _score: score, _choices: choices, _fields: fields, _documents: documents });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (!isAdmin) return json({ error: "Admins only" }, 403);

    if (action === "create_admin") {
      const { data: authority, error: authorityError } = await admin.from("admin_creation_authority").select("user_id").eq("user_id", user.id).maybeSingle();
      if (authorityError || !canCreateAdmin(roleNames, !!authority)) return json({ error: "Your account cannot create additional admins." }, 403);
      const full_name = str(body.full_name, 100), email = str(body.email, 255).toLowerCase();
      const password = typeof body.password === "string" ? body.password : "";
      if (!full_name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return json({ error: "Name, valid email and password of at least 8 characters required." }, 400);
      const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
      if (error) return json({ error: error.message }, 400);
      const id = created.user.id;
      const { error: roleError } = await admin.from("user_roles").insert({ user_id: id, role: "admin" });
      if (roleError) { await admin.auth.admin.deleteUser(id); return json({ error: "Could not assign admin role" }, 500); }
      const { error: cleanupError } = await admin.from("user_roles").delete().eq("user_id", id).eq("role", "student");
      if (cleanupError) { await admin.auth.admin.deleteUser(id); return json({ error: "Could not finalize admin account" }, 500); }
      await admin.from("profiles").update({ registered_by: user.id }).eq("id", id);
      // Intentionally do not grant admin_creation_authority to newly created admins.
      return json({ ok: true });
    }

    if (action === "admin_block_status") {
      if (!isAdmin) return json({ error: "Admins only" }, 403);
      const { data: ids } = await admin.from("user_roles").select("user_id").in("role", ["admin", "viewer", "finance"]);
      const blocked: string[] = [];
      for (const r of ids ?? []) {
        const { data } = await admin.auth.admin.getUserById(r.user_id);
        const until = (data?.user as { banned_until?: string } | undefined)?.banned_until;
        if (until && new Date(until) > new Date()) blocked.push(r.user_id);
      }
      return json({ blocked });
    }

    if (action === "create_finance") {
      const { data: authority } = await admin.from("admin_creation_authority").select("user_id").eq("user_id", user.id).maybeSingle();
      if (!authority) return json({ error: "Only the main admin can create finance accounts." }, 403);
      const full_name = str(body.full_name, 100), email = str(body.email, 255).toLowerCase();
      const password = typeof body.password === "string" ? body.password : "";
      if (!full_name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return json({ error: "Name, valid email and password of at least 8 characters required." }, 400);
      const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
      if (error) return json({ error: error.message }, 400);
      const id = created.user.id;
      const { error: roleError } = await admin.from("user_roles").insert({ user_id: id, role: "finance" });
      if (roleError) { await admin.auth.admin.deleteUser(id); return json({ error: "Could not assign finance role" }, 500); }
      await admin.from("user_roles").delete().eq("user_id", id).eq("role", "student");
      await admin.from("profiles").update({ registered_by: user.id }).eq("id", id);
      return json({ ok: true });
    }

    if (action === "create_viewer" || action === "set_viewer") {
      const { data: authority } = await admin.from("admin_creation_authority").select("user_id").eq("user_id", user.id).maybeSingle();
      if (!authority) return json({ error: "Only the main admin can manage viewers." }, 403);
      let id = str(body.id, 64);
      if (action === "create_viewer") {
        const full_name = str(body.full_name, 100), email = str(body.email, 255).toLowerCase();
        const password = typeof body.password === "string" ? body.password : "";
        if (!full_name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return json({ error: "Name, valid email and password of at least 8 characters required." }, 400);
        const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
        if (error) return json({ error: error.message }, 400);
        id = created.user.id;
        await admin.from("profiles").update({ registered_by: user.id }).eq("id", id);
      } else {
        if (!id || id === user.id) return json({ error: "You cannot change your own role." }, 400);
        const { data: hasAuth } = await admin.from("admin_creation_authority").select("user_id").eq("user_id", id).maybeSingle();
        if (hasAuth) return json({ error: "This admin cannot be changed." }, 403);
        const { data: current } = await admin.from("user_roles").select("role").eq("user_id", id).in("role", ["admin", "viewer"]);
        if (!current?.length) return json({ error: "Select an admin or viewer account." }, 400);
      }
      const toViewer = action === "create_viewer" || body.viewer === true;
      const { error: addError } = await admin.from("user_roles").upsert({ user_id: id, role: toViewer ? "viewer" : "admin" }, { onConflict: "user_id,role" });
      if (addError) return json({ error: "Could not change role" }, 500);
      await admin.from("user_roles").delete().eq("user_id", id).in("role", toViewer ? ["admin", "student"] : ["viewer", "student"]);
      return json({ ok: true });
    }

    if (action === "update_admin" || action === "delete_admin" || action === "block_admin") {
      const id = str(body.id, 64);
      if (!id || id === user.id) return json({ error: "Use Account settings to change your own account." }, 400);
      const [{ data: target }, { data: role }] = await Promise.all([
        admin.from("profiles").select("registered_by").eq("id", id).maybeSingle(),
        admin.from("user_roles").select("user_id").eq("user_id", id).in("role", ["admin", "viewer", "finance"]).limit(1).maybeSingle(),
      ]);
      const { data: authority } = await admin.from("admin_creation_authority").select("user_id").eq("user_id", user.id).maybeSingle();
      if (!role || !canManageAdmin(user.id, target?.registered_by ?? null, !!authority)) return json({ error: "You can only manage admins you created." }, 403);
      if (action === "block_admin") {
        const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: body.blocked ? "876000h" : "none" });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      if (action === "delete_admin") {
        await admin.from("admin_creation_authority").delete().eq("user_id", id);
        await admin.from("user_roles").delete().eq("user_id", id);
        await admin.from("staff_permissions").delete().eq("user_id", id);
        await admin.from("profiles").delete().eq("id", id);
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      const full_name = str(body.full_name, 100), email = str(body.email, 255).toLowerCase(), phone = str(body.phone, 20);
      if (!full_name || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Name and a valid email are required." }, 400);
      const password = typeof body.password === "string" ? body.password : "";
      if (password && password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
      const { error: authError } = await admin.auth.admin.updateUserById(id, { email, email_confirm: true, ...(password ? { password } : {}), user_metadata: { full_name } });
      if (authError) return json({ error: authError.message }, 400);
      const { error } = await admin.from("profiles").update({ full_name, email, phone: phone || null }).eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "create_sub_admin") {
      if (!isAdmin) return json({ error: "Admins only" }, 403);
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
      if (!isAdmin) return json({ error: "Admins only" }, 403);
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
      if (!isAdmin) return json({ error: "Admins only" }, 403);
      const id = str(body.id, 64);
      const { data: staff, error: roleLookupError } = await admin.from("user_roles").select("role").eq("user_id", id).in("role", ["admin", "sub_admin", "department_head"]);
      if (roleLookupError || staff?.length) return json({ error: "Select a student account, not a staff account." }, 403);
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
      const { data: staff, error: roleLookupError } = await admin.from("user_roles").select("role").eq("user_id", id).in("role", ["admin", "sub_admin", "department_head"]);
      if (roleLookupError || staff?.length) return json({ error: "Select a student account, not a staff account." }, 403);
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
