import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Attempt, PortalExam, questionsOf } from "@/lib/portalExams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function DepartmentExam() {
  const { examId } = useParams(); const navigate = useNavigate();
  const [exam, setExam] = useState<PortalExam | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answerRef = useRef(answers); answerRef.current = answers;
  const [active, setActive] = useState(false); const activeRef = useRef(false);
  const [busy, setBusy] = useState(false); const saving = useRef(false);
  const [confirm, setConfirm] = useState(false); const [seconds, setSeconds] = useState(0);
  const [saveStatus, setSaveStatus] = useState("Answers saved");
  const [error, setError] = useState(""); const [hidden, setHidden] = useState(false);
  const lastExit = useRef(0);
  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return navigate("/auth");
    if (!examId) return;
    const { data, error } = await supabase.from("portal_exams").select("*").eq("id", examId).maybeSingle();
    if (error || !data) return setError("This exam is not available for your account."); setExam(data);
  })(); }, [examId, navigate]);
  const finish = useCallback(async () => {
    activeRef.current = false; setActive(false); setConfirm(false);
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    toast.success("Exam submitted. Your department head will grade your answers."); navigate("/student-dashboard", { replace: true });
  }, [navigate]);
  const persist = useCallback(async (submit = false) => {
    if (!attempt || saving.current) return;
    saving.current = true; if (submit) setBusy(true);
    const { data, error } = await supabase.rpc("save_portal_exam_answers", { _attempt: attempt.id, _answers: answerRef.current, _submit: submit });
    saving.current = false; setBusy(false);
    if (error) { setSaveStatus("Not saved · reconnect and retry"); if (submit) toast.error(error.message); return; }
    setSaveStatus("Answers saved"); if (data?.submitted_at) await finish();
  }, [attempt, finish]);
  const logExit = useCallback((reason: string) => {
    if (!attempt || !activeRef.current || Date.now() - lastExit.current < 2500) return;
    lastExit.current = Date.now();
    supabase.from("exam_exit_events").insert({ user_id: attempt.user_id, department: attempt.department, reason: `Portal exam ${exam?.title ?? ""}: ${reason}` }).then(({ error }) => { if (error) setSaveStatus("Exit report pending · check connection"); });
    toast.error("Exam departure detected and reported to your department head.");
  }, [attempt, exam]);
  useEffect(() => {
    if (!active || !attempt) return;
    const timer = window.setInterval(() => { const n = Math.max(0, Math.ceil((new Date(attempt.deadline).getTime() - Date.now()) / 1000)); setSeconds(n); if (n === 0) persist(true); }, 1000);
    const autosave = window.setInterval(() => persist(), 4000);
    const vis = () => { setHidden(document.hidden); if (document.hidden) logExit("Switched tab or minimized"); };
    const blur = () => { logExit("Left exam window"); }; const fs = () => { if (!document.fullscreenElement) logExit("Exited fullscreen"); };
    const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; logExit("Attempted to leave or reload"); };
    const block = (e: Event) => e.preventDefault();
    const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && ["p", "c", "s"].includes(e.key.toLowerCase())) e.preventDefault(); };
    const pop = () => { history.pushState(null, "", location.href); logExit("Attempted back navigation"); };
    history.pushState(null, "", location.href);
    document.body.classList.add("secure-exam");
    document.addEventListener("visibilitychange", vis); document.addEventListener("fullscreenchange", fs); document.addEventListener("contextmenu", block); document.addEventListener("copy", block); document.addEventListener("keydown", key);
    window.addEventListener("blur", blur); window.addEventListener("beforeunload", unload); window.addEventListener("popstate", pop);
    return () => { clearInterval(timer); clearInterval(autosave); document.body.classList.remove("secure-exam"); document.removeEventListener("visibilitychange", vis); document.removeEventListener("fullscreenchange", fs); document.removeEventListener("contextmenu", block); document.removeEventListener("copy", block); document.removeEventListener("keydown", key); window.removeEventListener("blur", blur); window.removeEventListener("beforeunload", unload); window.removeEventListener("popstate", pop); };
  }, [active, attempt, persist, logExit]);
  const start = async () => {
    if (!examId) return;
    try { await document.documentElement.requestFullscreen?.(); } catch { /* unsupported mobile browsers still receive exit monitoring */ }
    setBusy(true); const { data, error } = await supabase.rpc("start_portal_exam", { _exam: examId }); setBusy(false);
    if (error || !data) { if (document.fullscreenElement) await document.exitFullscreen().catch(() => {}); return toast.error(error?.message ?? "Could not start exam"); }
    if (data.submitted_at) { if (document.fullscreenElement) await document.exitFullscreen().catch(() => {}); return navigate("/student-dashboard"); }
    setAttempt(data); setAnswers(data.answers as Record<string, string>); setSeconds(Math.max(0, Math.ceil((new Date(data.deadline).getTime() - Date.now()) / 1000))); activeRef.current = true; setActive(true);
  };
  if (error) return <main className="container py-16 space-y-4"><h1 className="text-2xl font-bold">Exam Unavailable</h1><p>{error}</p><Button onClick={() => navigate("/student-dashboard")}>Back to Dashboard</Button></main>;
  if (!exam) return <main className="container py-16">Loading exam…</main>;
  return <main className="min-h-screen bg-background">
    <div className="sticky top-0 z-20 border-b bg-background"><div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3"><h1 className="font-bold text-xl break-words">{exam.title}</h1>{active && <div className="flex items-center gap-2 font-semibold text-primary" data-no-translate><Clock className="h-4 w-4" />{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</div>}</div></div>
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {!active ? <><ShieldCheck className="h-10 w-10 text-primary" /><p className="whitespace-pre-wrap">{exam.description}</p><p>{exam.duration_minutes} minutes · {questionsOf(exam.questions).length} questions</p><ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground"><li>The timer continues if you leave or refresh. Previously saved answers can be resumed.</li><li>Stay in this portal. Tab switches and detected departures are reported to your department head.</li><li>Fullscreen is requested where supported. Browsers cannot fully prevent exits, screenshots or recording.</li></ul><div className="flex gap-3"><Button disabled={busy} onClick={start}>Start / Resume Exam</Button><Button variant="outline" onClick={() => navigate("/student-dashboard")}>Cancel</Button></div></> : <>
        <p className="text-sm text-muted-foreground" aria-live="polite">{saveStatus}</p>
        {questionsOf(attempt?.questions).map((q, i) => <section key={q.id} className="border-b pb-6 space-y-3"><h2 className="font-semibold text-lg break-words">{i + 1}. {q.prompt} {q.required && <span className="text-destructive">*</span>}</h2><p className="text-sm text-muted-foreground">{q.points} points</p>{q.type === "choice" ? <RadioGroup aria-label={`Answer question ${i + 1}`} value={answers[q.id] ?? ""} onValueChange={(v) => { setAnswers((a) => ({ ...a, [q.id]: v })); setSaveStatus("Saving…"); }}>{q.options.map((o, j) => <div key={o} className="flex gap-3 items-start border rounded-md p-3"><RadioGroupItem id={`${q.id}-${j}`} value={o} /><Label htmlFor={`${q.id}-${j}`} className="break-words leading-5">{o}</Label></div>)}</RadioGroup> : q.type === "paragraph" ? <Textarea aria-label={`Answer question ${i + 1}`} maxLength={5000} rows={5} value={answers[q.id] ?? ""} onChange={(e) => { setAnswers((a) => ({ ...a, [q.id]: e.target.value })); setSaveStatus("Saving…"); }} /> : <Input aria-label={`Answer question ${i + 1}`} maxLength={5000} value={answers[q.id] ?? ""} onChange={(e) => { setAnswers((a) => ({ ...a, [q.id]: e.target.value })); setSaveStatus("Saving…"); }} />}</section>)}
        <div className="flex justify-between gap-3"><Button variant="outline" disabled={busy} onClick={() => persist()}>Save Answers</Button><Button disabled={busy || seconds === 0} onClick={() => setConfirm(true)}>Submit Exam</Button></div>
      </>}
    </div>
    {hidden && active && <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6"><p className="text-xl font-semibold text-destructive">Return to your exam. Departure was detected.</p></div>}
    <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Submit your exam?</AlertDialogTitle><AlertDialogDescription>You cannot change your answers after submitting.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Continue Exam</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); persist(true); }}>Submit</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}