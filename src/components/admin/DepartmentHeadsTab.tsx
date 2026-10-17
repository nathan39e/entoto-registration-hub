import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DEPARTMENTS } from "@/data/departments";

type Head = { user_id: string; department: string; full_name: string; email: string; students: number };

const DepartmentHeadsTab = () => {
  const [heads, setHeads] = useState<Head[]>([]);
  const [busy, setBusy] = useState(false);
  const [dept, setDept] = useState("");
  const [nw, setNw] = useState({ full_name: "", email: "", password: "" });
  const [existing, setExisting] = useState("");

  const load = async () => {
    const [{ data: h }, { data: profs }, { data: apps }] = await Promise.all([
      supabase.from("department_heads").select("user_id, department"),
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("applications").select("first_department"),
    ]);
    setHeads((h ?? []).map((r) => {
      const p = profs?.find((x) => x.id === r.user_id);
      return { ...r, full_name: p?.full_name ?? "Unknown", email: p?.email ?? "", students: (apps ?? []).filter((a) => a.first_department === r.department).length };
    }));
  };
  useEffect(() => { load(); }, []);

  const call = async (body: Record<string, unknown>, msg: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("manage-users", { body: { action: "assign_department_head", ...body } });
    setBusy(false);
    if (error || data?.error) return toast.error(data?.error || error?.message);
    toast.success(msg); setNw({ full_name: "", email: "", password: "" }); setExisting(""); setDept(""); load();
  };

  const free = DEPARTMENTS.filter((d) => !heads.some((h) => h.department === d));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Heads ({heads.length}/{DEPARTMENTS.length})</CardTitle>
        <CardDescription>Each department can have only one head.</CardDescription>
        <div className="max-w-xs pt-2">
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>{free.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <form className="flex flex-wrap gap-2 mt-2" onSubmit={(e) => { e.preventDefault(); if (!dept) return toast.error("Select a department"); call({ department: dept, ...nw }, "Department head created"); }}>
          <Input required placeholder="Full name" value={nw.full_name} onChange={(e) => setNw({ ...nw, full_name: e.target.value })} className="max-w-[200px]" />
          <Input type="email" required placeholder="Email" value={nw.email} onChange={(e) => setNw({ ...nw, email: e.target.value })} className="max-w-[220px]" />
          <Input required minLength={8} placeholder="Password (min 8)" value={nw.password} onChange={(e) => setNw({ ...nw, password: e.target.value })} className="max-w-[180px]" />
          <Button type="submit" disabled={busy}>Create Department Head</Button>
        </form>
        <form className="flex flex-wrap gap-2 mt-2" onSubmit={(e) => { e.preventDefault(); if (!dept) return toast.error("Select a department"); call({ department: dept, email: existing }, "Department head assigned"); }}>
          <Input type="email" required placeholder="Email of an existing account" value={existing} onChange={(e) => setExisting(e.target.value)} className="max-w-sm" />
          <Button type="submit" variant="outline" disabled={busy}>Assign Existing Account</Button>
        </form>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Head</TableHead><TableHead>Email</TableHead><TableHead>Students</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {heads.map((h) => (
              <TableRow key={h.user_id}>
                <TableCell className="font-medium">{h.department}</TableCell>
                <TableCell>{h.full_name}</TableCell>
                <TableCell>{h.email}</TableCell>
                <TableCell className="font-bold text-primary">{h.students}</TableCell>
                <TableCell><Button size="sm" variant="outline" disabled={busy} onClick={() => call({ department: h.department, remove: true }, "Department head removed")}>Remove</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DepartmentHeadsTab;
