import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEPARTMENTS, DEPARTMENT_FIELDS } from "@/data/departments";
import { matchesStudentExport, occupationOf } from "@/lib/studentExport";
import FilterCounts from "@/components/FilterCounts";

const StudentFilterList = () => {
  const [rows, setRows] = useState<{ p: any; a: any }[]>([]);
  const [department, setDepartment] = useState("All");
  const [program, setProgram] = useState("All");
  const [occupation, setOccupation] = useState("All");

  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: profs }, { data: apps }, { data: staff }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, student_code, created_at"),
      supabase.from("applications").select("user_id, first_choice, first_department, program, status"),
      supabase.from("user_roles").select("user_id").in("role", ["admin", "sub_admin", "department_head"]),
    ]);
    const ex = new Set((staff ?? []).map((r) => r.user_id));
    const byUser = new Map((apps ?? []).map((a) => [a.user_id, a]));
    setRows((profs ?? []).filter((p) => !ex.has(p.id)).map((p) => ({ p, a: byUser.get(p.id) })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const shown = rows.filter(({ p, a }) => matchesStudentExport(p, a, { from: "", to: "", department, program, status: "All", search: "", occupation }));
  const occs = department === "All" ? Object.values(DEPARTMENT_FIELDS).flat() : DEPARTMENT_FIELDS[department] ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Students</CardTitle>
        <CardDescription>Filter by department, program and occupation.</CardDescription>
        <div className="flex justify-end pt-2"><Button variant="outline" size="sm" onClick={load} disabled={loading} aria-label="Refresh student list"><RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />{loading ? "Refreshing..." : "Refresh"}</Button></div>
        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          <div><Label>Department</Label><Select value={department} onValueChange={(v) => { setDepartment(v); setOccupation("All"); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All", ...DEPARTMENTS].map((d) => <SelectItem key={d} value={d}>{d === "All" ? "All departments" : d}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Program</Label><Select value={program} onValueChange={setProgram}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All", "Regular", "Extension", "Weekend"].map((p) => <SelectItem key={p} value={p}>{p === "All" ? "All programs" : p}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Occupation</Label><Select value={occupation} onValueChange={setOccupation}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All", ...occs].map((o) => <SelectItem key={o} value={o}>{o === "All" ? "All occupations" : o}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <FilterCounts items={shown.map(({ a }) => ({ program: a?.program, occupation: occupationOf(a?.first_choice) }))} />
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto space-y-1">
        {shown.length === 0 && <p className="text-sm text-muted-foreground">No students match.</p>}
        {shown.map(({ p, a }) => (
          <div key={p.id} className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm">
            <span className="break-words">{p.full_name} <span className="text-muted-foreground">· {p.student_code}</span></span>
            <span className="text-muted-foreground">{a ? `${a.program ?? "-"} · ${occupationOf(a.first_choice) || "-"}` : "Not applied"}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
export default StudentFilterList;
