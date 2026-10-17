import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminsTab() {
  const [allowed, setAllowed] = useState(false);
  const [rows, setRows] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const [permission, roles, profiles] = await Promise.all([supabase.rpc("can_create_admin", { _user: user.id }), supabase.from("user_roles").select("user_id").eq("role", "admin"), supabase.from("profiles").select("id, full_name, email")]);
    if (permission.error || roles.error || profiles.error) return toast.error("Could not load admins");
    setAllowed(permission.data === true); setRows((profiles.data ?? []).filter((p) => roles.data?.some((r) => r.user_id === p.id)));
  };
  useEffect(() => { load(); }, []);
  return <section className="space-y-5"><h2 className="text-xl font-semibold">Admins ({rows.length})</h2>{allowed && <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end" onSubmit={async (e) => {
    e.preventDefault(); setBusy(true); const { data, error } = await supabase.functions.invoke("manage-users", { body: { action: "create_admin", ...form } }); setBusy(false);
    if (error || data?.error) return toast.error(data?.error ?? error?.message); toast.success("Admin created without admin-creation permission"); setForm({ full_name: "", email: "", password: "" }); load();
  }}><div><Label htmlFor="admin-name">Full name</Label><Input id="admin-name" required maxLength={100} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div><div><Label htmlFor="admin-email">Email</Label><Input id="admin-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div><Label htmlFor="admin-password">Password (minimum 8)</Label><Input id="admin-password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div><Button disabled={busy} type="submit">Create Admin</Button></form>}<div className="divide-y">{rows.map((r) => <div key={r.id} className="py-3"><p className="font-medium">{r.full_name}</p><p className="text-sm text-muted-foreground">{r.email}</p></div>)}</div></section>;
}