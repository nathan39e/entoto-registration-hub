import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Row = { id: string; full_name: string; email: string; count: number };

const SubAdminsTab = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: roles }, { data: profs }] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "sub_admin"),
      supabase.from("profiles").select("id, full_name, email, registered_by"),
    ]);
    const all = profs ?? [];
    setRows((roles ?? []).map((r) => {
      const p = all.find((x) => x.id === r.user_id);
      return { id: r.user_id, full_name: p?.full_name ?? "Unknown", email: p?.email ?? "", count: all.filter((x) => x.registered_by === r.user_id).length };
    }));
  };
  useEffect(() => { load(); }, []);

  const call = async (body: Record<string, unknown>, msg: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("manage-users", { body });
    setBusy(false);
    if (error || data?.error) return toast.error(data?.error || error?.message);
    toast.success(msg); setEmail(""); load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sub Admins ({rows.length})</CardTitle>
        <CardDescription>Sub admins can look up students by code, view their documents and register new students. The person must already have an account.</CardDescription>
        <form className="flex flex-wrap gap-2 mt-2" onSubmit={(e) => { e.preventDefault(); call({ action: "set_sub_admin", email }, "Sub admin added"); }}>
          <Input type="email" required placeholder="Email of the account" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-sm" />
          <Button type="submit" disabled={busy}>Make Sub Admin</Button>
        </form>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Students Registered</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.full_name}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell className="font-bold text-primary">{r.count}</TableCell>
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
