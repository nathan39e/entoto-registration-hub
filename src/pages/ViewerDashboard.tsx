import GenderStats from "@/components/GenderStats";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { DEPARTMENTS } from "@/data/departments";
import { toast } from "sonner";

type Row = { full_name: string; student_code: string; phone: string | null; program: string | null; status: string | null; first_choice: string; second_choice: string; third_choice: string; current_department: string | null; placed_department: string | null; submitted_at: string; gender: string | null };

const STATUS: Record<string, string> = { approved: "Approved", waiting_list: "Waiting list", pending: "Document review", rejected: "Rejected" };

export default function ViewerDashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/auth");
    const { data, error } = await supabase.rpc("viewer_student_overview");
    setLoading(false);
    if (error) { toast.error("You don't have permission to view this page."); return navigate("/"); }
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, []);

  const deptOf = (r: Row) => r.placed_department || r.current_department || r.first_choice.split(" — ")[0];
  const counts = useMemo(() => DEPARTMENTS.map((d) => ({ d, n: rows.filter((r) => deptOf(r) === d).length })), [rows]);
  const term = q.trim().toLowerCase();
  const shown = rows.filter((r) => (dept === "All" || deptOf(r) === dept) && (!term || [r.full_name, r.student_code, r.phone ?? ""].some((x) => x.toLowerCase().includes(term))));

  return (
    <div className="min-h-screen bg-background select-none" onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()}>
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Viewer Dashboard</h1>
            <p className="text-muted-foreground">View-only access · {rows.length} students applied</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>

        <GenderStats genders={(dept === "All" ? rows : rows.filter((r) => deptOf(r) === dept)).map((r) => r.gender)} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {counts.map(({ d, n }) => (
            <button key={d} type="button" onClick={() => setDept(dept === d ? "All" : d)} className="text-left">
              <Card className={`h-full transition hover:shadow-md ${dept === d ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-primary">{n}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{d}</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>{dept === "All" ? "All students" : dept} ({shown.length})</CardTitle>
            <Input placeholder="Search name, ID or phone" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3">Name</th><th className="pr-3">Student ID</th><th className="pr-3">Phone</th><th className="pr-3">Program</th><th className="pr-3">Department</th><th className="pr-3">Choices</th><th>Status</th>
              </tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.student_code} className="border-b align-top">
                    <td className="py-2 pr-3 font-medium">{r.full_name}</td>
                    <td className="pr-3">{r.student_code}</td>
                    <td className="pr-3">{r.phone ?? "—"}</td>
                    <td className="pr-3">{r.program ?? "—"}</td>
                    <td className="pr-3">{deptOf(r)}</td>
                    <td className="pr-3 text-xs text-muted-foreground">{[r.first_choice, r.second_choice, r.third_choice].join(" · ")}</td>
                    <td>{STATUS[r.status ?? ""] ?? r.status ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!shown.length && !loading && <p className="py-4 text-sm text-muted-foreground">No students match.</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
