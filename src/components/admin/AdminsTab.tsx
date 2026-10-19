import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Row = { id: string; full_name: string; email: string; phone: string | null; registered_by: string | null };

export default function AdminsTab() {
  const [allowed, setAllowed] = useState(false);
  const [me, setMe] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [edit, setEdit] = useState<{ id: string; full_name: string; email: string; phone: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    setMe(user.id);
    const [permission, roles, profiles] = await Promise.all([supabase.rpc("can_create_admin", { _user: user.id }), supabase.from("user_roles").select("user_id").eq("role", "admin"), supabase.from("profiles").select("id, full_name, email, phone, registered_by")]);
    if (permission.error || roles.error || profiles.error) return toast.error("Could not load admins");
    setAllowed(permission.data === true); setRows((profiles.data ?? []).filter((p) => roles.data?.some((r) => r.user_id === p.id)));
  };
  useEffect(() => { load(); }, []);
  const call = async (body: Record<string, unknown>, msg: string) => {
    setBusy(true); const { data, error } = await supabase.functions.invoke("manage-users", { body }); setBusy(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message); return false; }
    toast.success(msg); load(); return true;
  };
  const term = q.trim().toLowerCase();
  const shown = rows.filter((r) => !term || [r.full_name, r.email, r.phone ?? ""].some((x) => x.toLowerCase().includes(term)));
  return <section className="space-y-5"><h2 className="text-xl font-semibold">Admins ({rows.length})</h2>{allowed && <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end" onSubmit={async (e) => {
    e.preventDefault(); if (await call({ action: "create_admin", ...form }, "Admin created without admin-creation permission")) setForm({ full_name: "", email: "", password: "" });
  }}><div><Label htmlFor="admin-name">Full name</Label><Input id="admin-name" required maxLength={100} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div><div><Label htmlFor="admin-email">Email</Label><Input id="admin-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div><Label htmlFor="admin-password">Password (minimum 8)</Label><Input id="admin-password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div><Button disabled={busy} type="submit">Create Admin</Button></form>}
    <Input aria-label="Search admins" placeholder="Search admins by name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
    <div className="divide-y">{shown.map((r) => <div key={r.id} className="py-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{r.full_name}</p><p className="text-sm text-muted-foreground">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p></div>
        {r.registered_by === me && r.id !== me && <div className="flex gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => setEdit({ id: r.id, full_name: r.full_name, email: r.email, phone: r.phone ?? "", password: "" })}>Edit</Button><Button size="sm" variant="destructive" disabled={busy} onClick={() => { if (confirm(`Delete admin ${r.full_name}? This cannot be undone.`)) call({ action: "delete_admin", id: r.id }, "Admin deleted"); }}>Delete</Button></div>}</div>
      {edit?.id === r.id && <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 items-end" onSubmit={async (e) => { e.preventDefault(); if (await call({ action: "update_admin", ...edit }, "Admin updated")) setEdit(null); }}>
        <Input aria-label="Full name" required maxLength={100} value={edit.full_name} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} />
        <Input aria-label="Email" type="email" required value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
        <Input aria-label="Phone" placeholder="Phone" maxLength={20} value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
        <Input aria-label="New password" type="password" autoComplete="new-password" placeholder="New password (optional)" minLength={8} value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} />
        <div className="flex gap-2"><Button type="submit" size="sm" disabled={busy}>Save</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div>
      </form>}
    </div>)}{!shown.length && <p className="py-3 text-sm text-muted-foreground">No admins match.</p>}</div></section>;
}
