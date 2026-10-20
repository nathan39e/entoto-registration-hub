import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type Row = { id: string; full_name: string; email: string; phone: string; count: number; canEdit: boolean };

const SubAdminsTab = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [email, setEmail] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [nw, setNw] = useState({ full_name: "", email: "", password: "" });

  const load = async () => {
    const [{ data: roles }, { data: profs }, { data: permissions }] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "sub_admin"),
      supabase.from("profiles").select("id, full_name, email, phone, registered_by"),
      supabase.from("staff_permissions").select("user_id, can_edit_departments"),
    ]);
    const all = profs ?? [];
    setRows((roles ?? []).map((r) => {
      const p = all.find((x) => x.id === r.user_id);
      return { id: r.user_id, full_name: p?.full_name ?? "Unknown", email: p?.email ?? "", phone: p?.phone ?? "", count: all.filter((x) => x.registered_by === r.user_id).length, canEdit: permissions?.some((x) => x.user_id === r.user_id && x.can_edit_departments) ?? false };
    }));
  };
  useEffect(() => { load(); }, []);

  const call = async (body: Record<string, unknown>, msg: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("manage-users", { body });
    setBusy(false);
    if (error || data?.error) return toast.error(data?.error || error?.message);
    toast.success(msg); setEmail(""); setNw({ full_name: "", email: "", password: "" }); load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sub Admins ({rows.length})</CardTitle>
        <CardDescription>Sub admins can look up students by code, view their documents and register new students. Create a new staff account below, or promote an existing account by email.</CardDescription>
        <form className="flex flex-wrap gap-2 mt-2" onSubmit={(e) => { e.preventDefault(); call({ action: "create_sub_admin", ...nw }, "Sub admin account created"); }}>
          <Input required placeholder="Full name" value={nw.full_name} onChange={(e) => setNw({ ...nw, full_name: e.target.value })} className="max-w-[200px]" />
          <Input type="email" required placeholder="Email" value={nw.email} onChange={(e) => setNw({ ...nw, email: e.target.value })} className="max-w-[220px]" />
          <Input required minLength={8} placeholder="Password (min 8)" value={nw.password} onChange={(e) => setNw({ ...nw, password: e.target.value })} className="max-w-[180px]" />
          <Button type="submit" disabled={busy}>Create Sub Admin</Button>
        </form>
        <form className="flex flex-wrap gap-2 mt-2" onSubmit={(e) => { e.preventDefault(); call({ action: "set_sub_admin", email }, "Sub admin added"); }}>
          <Input type="email" required placeholder="Email of the account" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-sm" />
          <Button type="submit" disabled={busy}>Promote Existing Account</Button>
        </form>
        <Input aria-label="Search sub admins" placeholder="Search sub admins by name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm mt-2" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Students Registered</TableHead><TableHead>Edit Department Choices</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.filter((r) => !q.trim() || [r.full_name, r.email, r.phone].some((x) => x.toLowerCase().includes(q.trim().toLowerCase()))).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.full_name}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell className="font-bold text-primary">{r.count}</TableCell>
                <TableCell><div className="flex items-center gap-2"><Switch aria-label={`Allow ${r.full_name} to edit department choices`} checked={r.canEdit} disabled={busy} onCheckedChange={(allowed) => call({ action: "set_department_edit_permission", id: r.id, allowed }, allowed ? "Department editing allowed" : "Department editing denied")} /><span className="text-sm text-muted-foreground">{r.canEdit ? "Allowed" : "Denied"}</span></div></TableCell>
                <TableCell><Button size="sm" variant="outline" disabled={busy} onClick={() => call({ action: "set_sub_admin", email: r.email, remove: true }, "Sub admin removed")}>Remove</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SubAdminsTab;
