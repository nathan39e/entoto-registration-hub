import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Attempt, Grade, newQuestion, PortalExam, Question, questionsOf, validAward } from "@/lib/portalExams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, Save, FileCheck } from "lucide-react";
import { toast } from "sonner";

const localTime = (iso: string | null) => iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
const empty = () => ({ title: "", description: "", questions: [newQuestion()], duration_minutes: 60, opens_at: "", closes_at: "", published: false });

export default function PortalExamManager({ department }: { department: string }) {
  const [exams, setExams] = useState<PortalExam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string; student_code: string }[]>([]);
  const [editor, setEditor] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [draft, setDraft] = useState(empty);
  const [preview, setPreview] = useState(false);
  const [reviewExam, setReviewExam] = useState<string | null>(null);
  const [review, setReview] = useState<Attempt | null>(null);
  const [points, setPoints] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const [e, a, g, p] = await Promise.all([
      supabase.from("portal_exams").select("*").eq("department", department).order("created_at", { ascending: false }),
      supabase.from("portal_exam_attempts").select("*").eq("department", department),
      supabase.from("portal_exam_grades").select("*").eq("department", department),
      supabase.from("profiles").select("id, full_name, student_code"),
    ]);
    const error = e.error || a.error || g.error || p.error;
    if (error) return toast.error(error.message);
    setExams(e.data ?? []); setAttempts(a.data ?? []); setGrades(g.data ?? []); setProfiles(p.data ?? []);
  };
  useEffect(() => { load(); }, [department]);
  const edit = (exam?: PortalExam) => {
    setId(exam?.id ?? null); setDraft(exam ? { title: exam.title, description: exam.description, questions: questionsOf(exam.questions), duration_minutes: exam.duration_minutes, opens_at: localTime(exam.opens_at), closes_at: localTime(exam.closes_at), published: exam.published } : empty());
    setPreview(false); setEditor(true);
  };
  const updateQuestion = (index: number, patch: Partial<Question>) => setDraft((d) => ({ ...d, questions: d.questions.map((q, i) => i === index ? { ...q, ...patch } : q) }));
  const move = (index: number, delta: number) => setDraft((d) => { const qs = [...d.questions]; const other = index + delta; if (other < 0 || other >= qs.length) return d; [qs[index], qs[other]] = [qs[other], qs[index]]; return { ...d, questions: qs }; });
  const save = async (publish: boolean) => {
    setBusy(true);
    const { error } = await supabase.rpc("save_portal_exam", { _id: id as string, _definition: { ...draft, published: publish, opens_at: draft.opens_at ? new Date(draft.opens_at).toISOString() : null, closes_at: draft.closes_at ? new Date(draft.closes_at).toISOString() : null } as unknown as Json });
    setBusy(false); if (error) return toast.error(error.message);
    toast.success(publish ? "Exam published" : "Draft saved"); setEditor(false); load();
  };
  const openReview = (a: Attempt) => {
    const g = grades.find((x) => x.attempt_id === a.id);
    setReview(a); setPoints(Object.fromEntries(Object.entries((g?.points ?? {}) as Record<string, number>).map(([k, v]) => [k, String(v)]))); setFeedback(g?.feedback ?? "");
  };
  const grade = async (publish: boolean) => {
    if (!review) return;
    const values: Record<string, number> = {};
    for (const q of questionsOf(review.questions)) {
      if (!points[q.id]?.trim()) { if (publish) return toast.error("Grade every question before publishing"); continue; }
      const n = Number(points[q.id]); if (!validAward(n, q.points)) return toast.error(`Points for this question must be 0–${q.points}`); values[q.id] = n;
    }
    setBusy(true); const { error } = await supabase.rpc("grade_portal_exam", { _attempt: review.id, _points: values, _feedback: feedback, _publish: publish }); setBusy(false);
    if (error) return toast.error(error.message); toast.success(publish ? "Grade published to student" : "Grade draft saved"); setReview(null); load();
  };
  return <section className="space-y-5 border-t pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Portal Entry Exams</h2><Button onClick={() => edit()}><Plus className="mr-2 h-4 w-4" />Create Exam</Button></div>
    {!exams.length && <p className="text-sm text-muted-foreground">No portal exams yet.</p>}
    <div className="divide-y">{exams.map((e) => <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0"><h3 className="font-semibold break-words">{e.title}</h3><p className="text-sm text-muted-foreground">{questionsOf(e.questions).length} questions · {e.duration_minutes} minutes · {attempts.filter((a) => a.exam_id === e.id).length} attempts</p><Badge variant={e.published ? "default" : "secondary"}>{e.published ? "Published" : "Closed / Draft"}</Badge></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => edit(e)} disabled={attempts.some((a) => a.exam_id === e.id)}>Edit</Button><Button variant="outline" onClick={async () => { const { error } = await supabase.rpc("set_portal_exam_published", { _id: e.id, _published: !e.published }); if (error) toast.error(error.message); else load(); }}>{e.published ? "Close" : "Publish"}</Button><Button variant="secondary" onClick={() => { setReviewExam(e.id); load(); }}><FileCheck className="mr-2 h-4 w-4" />Answers & Grades</Button></div>
    </div>)}</div>
    <Dialog open={editor} onOpenChange={setEditor}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{id ? "Edit Exam" : "Create Exam"} · {department}</DialogTitle></DialogHeader>
      <Tabs value={preview ? "preview" : "questions"} onValueChange={(v) => setPreview(v === "preview")}><TabsList><TabsTrigger value="questions">Questions</TabsTrigger><TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4" />Preview</TabsTrigger></TabsList>
        <TabsContent value="questions" className="space-y-5">
          <div><Label htmlFor="portal-title">Exam title</Label><Input id="portal-title" maxLength={200} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
          <div><Label htmlFor="portal-description">Exam instructions</Label><Textarea id="portal-description" maxLength={2000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
          <div className="grid sm:grid-cols-3 gap-3"><div><Label htmlFor="duration">Time limit (minutes)</Label><Input id="duration" type="number" min={1} max={240} value={draft.duration_minutes} onChange={(e) => setDraft({ ...draft, duration_minutes: Number(e.target.value) })} /></div><div><Label htmlFor="opens">Opens</Label><Input id="opens" type="datetime-local" value={draft.opens_at} onChange={(e) => setDraft({ ...draft, opens_at: e.target.value })} /></div><div><Label htmlFor="closes">Closes</Label><Input id="closes" type="datetime-local" value={draft.closes_at} onChange={(e) => setDraft({ ...draft, closes_at: e.target.value })} /></div></div>
          {draft.questions.map((q, i) => <div key={q.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center"><Label htmlFor={`prompt-${q.id}`}>Question {i + 1}</Label><div className="flex"><Button size="icon" variant="ghost" title="Move up" aria-label={`Move question ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Move down" aria-label={`Move question ${i + 1} down`} disabled={i === draft.questions.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Delete question" aria-label={`Delete question ${i + 1}`} disabled={draft.questions.length === 1} onClick={() => setDraft({ ...draft, questions: draft.questions.filter((x) => x.id !== q.id) })}><Trash2 className="h-4 w-4" /></Button></div></div>
            <Textarea id={`prompt-${q.id}`} value={q.prompt} maxLength={2000} onChange={(e) => updateQuestion(i, { prompt: e.target.value })} />
            <div className="grid grid-cols-2 gap-3"><Select value={q.type} onValueChange={(v) => updateQuestion(i, { type: v as Question["type"] })}><SelectTrigger aria-label={`Question ${i + 1} type`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="choice">Multiple choice</SelectItem><SelectItem value="short">Short answer</SelectItem><SelectItem value="paragraph">Paragraph</SelectItem></SelectContent></Select><div><Input aria-label={`Question ${i + 1} maximum points`} type="number" min={0.01} max={100} step="0.01" value={q.points} onChange={(e) => updateQuestion(i, { points: Number(e.target.value) })} /></div></div>
            {q.type === "choice" && <div className="space-y-2">{q.options.map((o, j) => <div key={j} className="flex gap-2"><Input aria-label={`Question ${i + 1} option ${j + 1}`} value={o} maxLength={500} placeholder={`Option ${j + 1}`} onChange={(e) => updateQuestion(i, { options: q.options.map((x, k) => k === j ? e.target.value : x) })} /><Button size="icon" variant="ghost" title="Remove option" aria-label={`Remove option ${j + 1}`} disabled={q.options.length <= 2} onClick={() => updateQuestion(i, { options: q.options.filter((_, k) => k !== j) })}><Trash2 className="h-4 w-4" /></Button></div>)}<Button variant="ghost" size="sm" disabled={q.options.length >= 10} onClick={() => updateQuestion(i, { options: [...q.options, ""] })}><Plus className="h-4 w-4 mr-2" />Add option</Button></div>}
            <div className="flex items-center gap-2"><Switch aria-label={`Question ${i + 1} required`} checked={q.required} onCheckedChange={(v) => updateQuestion(i, { required: v })} /><span className="text-sm">Required · {q.points} points</span></div>
          </div>)}
          <Button variant="outline" disabled={draft.questions.length >= 100} onClick={() => setDraft({ ...draft, questions: [...draft.questions, newQuestion()] })}><Plus className="mr-2 h-4 w-4" />Add question</Button>
        </TabsContent>
        <TabsContent value="preview" className="space-y-5"><h2 className="text-2xl font-bold break-words">{draft.title || "Untitled exam"}</h2><p className="whitespace-pre-wrap">{draft.description}</p>{draft.questions.map((q, i) => <div key={q.id} className="border-b pb-4 space-y-2"><h3 className="font-medium">{i + 1}. {q.prompt || "Untitled question"} {q.required && "*"}</h3>{q.type === "choice" ? q.options.map((o, j) => <p key={j} className="text-muted-foreground">○ {o || `Option ${j + 1}`}</p>) : <Input disabled placeholder="Student answer" />}<p className="text-sm text-muted-foreground">{q.points} points</p></div>)}</TabsContent>
      </Tabs><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => save(false)}><Save className="h-4 w-4 mr-2" />Save Draft</Button><Button disabled={busy} onClick={() => save(true)}>Publish Exam</Button></div>
    </DialogContent></Dialog>
    <Dialog open={!!reviewExam} onOpenChange={(o) => { if (!o) setReviewExam(null); }}><DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Answers & Grades · {exams.find((e) => e.id === reviewExam)?.title}</DialogTitle></DialogHeader><Button variant="outline" onClick={load}>Refresh</Button>{!attempts.some((a) => a.exam_id === reviewExam) && <p className="text-muted-foreground">No attempts yet.</p>}{attempts.filter((a) => a.exam_id === reviewExam).map((a) => { const p = profiles.find((x) => x.id === a.user_id); const g = grades.find((x) => x.attempt_id === a.id); return <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-3"><div><p className="font-medium">{p?.full_name ?? "Student"}</p><p className="text-sm text-muted-foreground">{p?.student_code} · {g ? `${g.total}/${g.maximum} (${g.published ? "Published" : "Draft"})` : a.submitted_at ? "Awaiting grade" : new Date(a.deadline).getTime() <= Date.now() ? "Time expired" : "In progress"}</p></div><Button variant="outline" disabled={!a.submitted_at && new Date(a.deadline).getTime() > Date.now()} onClick={() => openReview(a)}>Review Answers</Button></div>; })}</DialogContent></Dialog>
    <Dialog open={!!review} onOpenChange={(o) => { if (!o) setReview(null); }}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Grade · {profiles.find((p) => p.id === review?.user_id)?.full_name ?? "Student"}</DialogTitle></DialogHeader>{review && questionsOf(review.questions).map((q, i) => <div key={q.id} className="border-b pb-4 space-y-2"><p className="font-medium">{i + 1}. {q.prompt}</p><p className="whitespace-pre-wrap break-words bg-muted p-3 rounded-md">{(review.answers as Record<string, string>)[q.id] || "No answer"}</p><Label htmlFor={`grade-${q.id}`}>Points awarded (0–{q.points})</Label><Input id={`grade-${q.id}`} type="number" min={0} max={q.points} step="0.01" value={points[q.id] ?? ""} onChange={(e) => setPoints({ ...points, [q.id]: e.target.value })} /></div>)}<Label htmlFor="grade-feedback">Feedback</Label><Textarea id="grade-feedback" maxLength={2000} value={feedback} onChange={(e) => setFeedback(e.target.value)} /><div className="flex justify-end gap-2"><Button disabled={busy} variant="outline" onClick={() => grade(false)}>Save Grade Draft</Button><Button disabled={busy} onClick={() => grade(true)}>Publish Grade</Button></div></DialogContent></Dialog>
  </section>;
}