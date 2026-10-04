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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const DECISIONS: Record<string, string> = { under_review: "Under review", accepted: "Accepted", waitlisted: "Waitlisted", rejected: "Rejected" };

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
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [evalFor, setEvalFor] = useState<any>(null);
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStudents = async (d: string) => {
    const [{ data: apps }, { data: profs }, { data: pls }] = await Promise.all([
      supabase.from("applications").select("*").order("submitted_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email, phone, student_code"),
      supabase.from("department_placements").select("*"),
    ]);
    const rows = (apps ?? []).map((a) => {
      const pl = pls?.find((x) => x.application_id === a.id);
      return { ...a, profile: profs?.find((p) => p.id === a.user_id), placement: pl };
    }).filter((a) => (a.placement ? a.placement.current_department === d || a.placement.placed_department === d : a.first_department === d));
    setStudents(rows);
  };

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
      await loadStudents(h.department);
      await loadExams(h.department);
      setLoading(false);
    })();
  }, [navigate]);

  const choiceOf = (s: any) => [s.first_choice, s.second_choice, s.third_choice][(s.placement?.choice_index ?? 1) - 1] ?? s.first_choice;
  const fieldOf = (choice: string) => choice?.split(" — ")[1] ?? "-";
  const decisionOf = (s: any) => s.placement?.decision ?? "under_review";
  const accepted = students.filter((s) => decisionOf(s) === "accepted").length;

  const openEval = (s: any) => { setEvalFor(s); setScore(s.placement?.exam_score?.toString() ?? ""); setNotes(s.placement?.notes ?? ""); };
  const submitEval = async (decision: string) => {
    if (!evalFor || !dept) return;
    const n = score.trim() === "" ? null : Number(score);
    if (n !== null && (isNaN(n) || n < 0 || n > 100)) return toast.error("Score must be between 0 and 100");
    if (decision !== "referred" && decision !== "under_review" && n === null) return toast.error("Enter the entry exam score first");
    setSaving(true);
    const { error } = await supabase.rpc("evaluate_application", { _app_id: evalFor.id, _score: n as number, _decision: decision, _notes: notes.trim() || null as any });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(decision === "referred" ? "Student referred to their next department choice" : `Saved: ${DECISIONS[decision]}`);
    setEvalFor(null); loadStudents(dept);
  };
  const fields = dept ? DEPARTMENT_FIELDS[dept] ?? [] : [];
  const shown = students.filter((s) => (field === "All" || fieldOf(choiceOf(s)) === field) && (decisionFilter === "all" || decisionOf(s) === decisionFilter));

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
          <Card><CardHeader className="pb-2"><CardDescription>Accepted</CardDescription><CardTitle className="text-3xl text-primary">{accepted}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Awaiting decision</CardDescription><CardTitle className="text-3xl">{students.filter((s) => decisionOf(s) === "under_review").length}</CardTitle></CardHeader></Card>
          {fields.map((f) => (
            <Card key={f}><CardHeader className="pb-2"><CardDescription className="line-clamp-2">{f}</CardDescription><CardTitle className="text-2xl">{students.filter((s) => fieldOf(choiceOf(s)) === f).length}</CardTitle></CardHeader></Card>
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
            <div className="flex flex-wrap gap-2 pt-1">
              {[["all", "All decisions"], ...Object.entries(DECISIONS)].map(([k, v]) => <Button key={k} size="sm" variant={decisionFilter === k ? "secondary" : "ghost"} onClick={() => setDecisionFilter(k)}>{v}</Button>)}
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Student Code</TableHead><TableHead>Phone</TableHead><TableHead>Field</TableHead>
                <TableHead>Program</TableHead><TableHead>Grade 12</TableHead><TableHead>Status</TableHead><TableHead>Exam</TableHead><TableHead>Placement</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {shown.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell><div className="font-medium">{s.profile?.full_name ?? "-"}</div><div className="text-xs text-muted-foreground">{s.profile?.email}</div></TableCell>
                    <TableCell>{s.profile?.student_code ?? "-"}</TableCell>
                    <TableCell>{s.profile?.phone ?? s.grade_12_results?.personal_info?.phone ?? "-"}</TableCell>
                    <TableCell>{fieldOf(choiceOf(s))}{(s.placement?.choice_index ?? 1) > 1 && <div className="text-xs text-muted-foreground">Referred (choice #{s.placement.choice_index})</div>}</TableCell>
                    <TableCell>{s.program ?? "-"}</TableCell>
                    <TableCell>{s.grade_12_results?.score ?? "-"}</TableCell>
                    <TableCell><Badge variant="outline">{s.status === "waiting_list" ? "Waiting list" : s.status}</Badge></TableCell>
                    <TableCell>{s.placement?.exam_score ?? "-"}</TableCell>
                    <TableCell><Badge variant={decisionOf(s) === "accepted" ? "default" : decisionOf(s) === "rejected" ? "destructive" : "secondary"}>{DECISIONS[decisionOf(s)]}</Badge></TableCell>
                    <TableCell>{(!s.placement || s.placement.current_department === dept) && <Button size="sm" variant="outline" onClick={() => openEval(s)}>Score &amp; Place</Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <Dialog open={!!evalFor} onOpenChange={(o) => !o && setEvalFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Score &amp; Place: {evalFor?.profile?.full_name}</DialogTitle>
            <DialogDescription>Choice #{evalFor?.placement?.choice_index ?? 1}: {evalFor && choiceOf(evalFor)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="score">Entry exam score (0–100)</Label><Input id="score" type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} /></div>
            <div><Label htmlFor="notes">Notes (shown to the student)</Label><Textarea id="notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button disabled={saving} onClick={() => submitEval("accepted")}>Accept</Button>
            <Button disabled={saving} variant="secondary" onClick={() => submitEval("waitlisted")}>Waitlist</Button>
            {(evalFor?.placement?.choice_index ?? 1) < 3 && <Button disabled={saving} variant="outline" onClick={() => submitEval("referred")}>Refer to next choice</Button>}
            <Button disabled={saving} variant="destructive" onClick={() => submitEval("rejected")}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default DepartmentHeadDashboard;
