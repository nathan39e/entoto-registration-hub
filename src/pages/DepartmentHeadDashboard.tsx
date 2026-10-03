import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DEPARTMENT_FIELDS } from "@/data/departments";

type Exam = { id: string; title: string; form_url: string; is_active: boolean };

const DepartmentHeadDashboard = () => {
  const navigate = useNavigate();
  const [dept, setDept] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [field, setField] = useState("All");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const loadExams = async (d: string) => {
    const { data } = await supabase.from("department_exams").select("id, title, form_url, is_active").eq("department", d).order("created_at", { ascending: false });
    setExams(data ?? []);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/auth");
      const { data: h } = await supabase.from("department_heads").select("department").eq("user_id", user.id).maybeSingle();
      if (!h) { toast.error("You are not assigned as a department head."); return navigate("/"); }
      setDept(h.department);
      const [{ data: apps }, { data: profs }] = await Promise.all([
        supabase.from("applications").select("*").eq("first_department", h.department).order("submitted_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email, phone, student_code"),
      ]);
      setStudents((apps ?? []).map((a) => ({ ...a, profile: profs?.find((p) => p.id === a.user_id) })));
      await loadExams(h.department);
      setLoading(false);
    })();
  }, [navigate]);

  const fieldOf = (choice: string) => choice.split(" — ")[1] ?? "-";
  const fields = dept ? DEPARTMENT_FIELDS[dept] ?? [] : [];
  const shown = students.filter((s) => field === "All" || fieldOf(s.first_choice) === field);

  const addExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dept) return;
    if (!/^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//.test(url.trim())) return toast.error("Please paste a Google Forms link");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("department_exams").insert({ department: dept, title: title.trim(), form_url: url.trim(), created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success("Exam published to your students"); setTitle(""); setUrl(""); loadExams(dept);
  };
  const toggle = async (x: Exam) => { await supabase.from("department_exams").update({ is_active: !x.is_active }).eq("id", x.id); dept && loadExams(dept); };
  const remove = async (x: Exam) => { await supabase.from("department_exams").delete().eq("id", x.id); dept && loadExams(dept); };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{dept} Department</h1>
          <p className="text-muted-foreground">Students who chose {dept} as their first choice</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardDescription>Total students</CardDescription><CardTitle className="text-3xl text-primary">{students.length}</CardTitle></CardHeader></Card>
          {fields.map((f) => (
            <Card key={f}><CardHeader className="pb-2"><CardDescription className="line-clamp-2">{f}</CardDescription><CardTitle className="text-2xl">{students.filter((s) => fieldOf(s.first_choice) === f).length}</CardTitle></CardHeader></Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Department Entry Exam</CardTitle>
            <CardDescription>Paste a Google Form link. Active exams show on your students' dashboards.</CardDescription>
            <form onSubmit={addExam} className="flex flex-wrap gap-2 pt-2">
              <Input required placeholder="Exam title" value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-xs" />
              <Input required placeholder="https://docs.google.com/forms/..." value={url} onChange={(e) => setUrl(e.target.value)} className="max-w-md" />
              <Button type="submit">Publish Exam</Button>
            </form>
          </CardHeader>
          <CardContent className="space-y-2">
            {exams.length === 0 && <p className="text-sm text-muted-foreground">No exams yet.</p>}
            {exams.map((x) => (
              <div key={x.id} className="flex flex-wrap items-center gap-2 border rounded-md p-3">
                <span className="font-medium">{x.title}</span>
                <Badge variant={x.is_active ? "default" : "secondary"}>{x.is_active ? "Active" : "Hidden"}</Badge>
                <a href={x.form_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Open</a>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggle(x)}>{x.is_active ? "Hide" : "Activate"}</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(x)}>Delete</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students ({shown.length})</CardTitle>
            <div className="flex flex-wrap gap-2 pt-2">
              {["All", ...fields].map((f) => <Button key={f} size="sm" variant={field === f ? "default" : "outline"} onClick={() => setField(f)}>{f}</Button>)}
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Student Code</TableHead><TableHead>Phone</TableHead><TableHead>Field</TableHead>
                <TableHead>Program</TableHead><TableHead>Grade 12</TableHead><TableHead>Status</TableHead><TableHead>Applied</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {shown.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell><div className="font-medium">{s.profile?.full_name ?? "-"}</div><div className="text-xs text-muted-foreground">{s.profile?.email}</div></TableCell>
                    <TableCell>{s.profile?.student_code ?? "-"}</TableCell>
                    <TableCell>{s.profile?.phone ?? s.grade_12_results?.personal_info?.phone ?? "-"}</TableCell>
                    <TableCell>{fieldOf(s.first_choice)}</TableCell>
                    <TableCell>{s.program ?? "-"}</TableCell>
                    <TableCell>{s.grade_12_results?.score ?? "-"}</TableCell>
                    <TableCell><Badge variant="outline">{s.status === "waiting_list" ? "Waiting list" : s.status}</Badge></TableCell>
                    <TableCell>{new Date(s.submitted_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default DepartmentHeadDashboard;
