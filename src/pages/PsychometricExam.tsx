import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { staffHome } from "@/lib/staffHome";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { buildExam, ExamQuestion } from "@/data/examQuestions";
import { DEPARTMENTS } from "@/data/departments";

const departmentName = (choice: string) => DEPARTMENTS.find((department) => choice === department || choice.startsWith(`${department} —`)) ?? choice;

const PsychometricExam = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [exam, setExam] = useState<{ title: string; form_url: string } | null>(null);
  const [studentCode, setStudentCode] = useState("");
  const [choices, setChoices] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [windowMsg, setWindowMsg] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [exitCount, setExitCount] = useState(0);
  const deptRef = useRef<string | null>(null);
  const userRef = useRef<string | null>(null);
  const lastLog = useRef(0);

  useEffect(() => {
    supabase.from("exam_forms").select("title, form_url").eq("is_active", true)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setExam(data));
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return navigate("/auth");
      const staffPath = await staffHome(user.id);
      if (staffPath) return navigate(staffPath, { replace: true });
      const [{ data: p }, { data: app }] = await Promise.all([
        supabase.from("profiles").select("student_code").eq("id", user.id).maybeSingle(),
        supabase.from("applications").select("first_choice, second_choice, third_choice, status, first_department").eq("user_id", user.id).maybeSingle(),
      ]);
      setStudentCode(p?.student_code ?? "");
      userRef.current = user.id;
      deptRef.current = app?.first_department ?? null;
      const { data: win } = await supabase.rpc("get_exam_window");
      const w = Array.isArray(win) ? win[0] : win;
      const now = Date.now();
      if (w?.exam_start && now < new Date(w.exam_start).getTime()) setWindowMsg(`The exam opens on ${new Date(w.exam_start).toLocaleString()}.`);
      else if (w?.exam_end && now > new Date(w.exam_end).getTime()) setWindowMsg(`The exam closed on ${new Date(w.exam_end).toLocaleString()}.`);
      if (!app || ["waiting_list", "rejected"].includes(app.status ?? "pending")) {
        setBlocked(true);
        setChoices([]);
        return;
      }
      setChoices(app ? [app.first_choice, app.second_choice, app.third_choice].map(departmentName) : []);
    });
  }, [navigate]);

  // Random question order AND random answer order for every student.
  const questions: ExamQuestion[] = useMemo(() => (choices ? buildExam(choices).map((q) => {
    const order = q.options.map((_, i) => ({ i, r: Math.random() })).sort((a, b) => a.r - b.r).map((x) => x.i);
    return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
  }) : []), [choices]);

  const logExit = useCallback(async (reason: string) => {
    if (!userRef.current || Date.now() - lastLog.current < 3000) return;
    lastLog.current = Date.now();
    setExitCount((c) => c + 1);
    toast.error("You left the exam page. Your department head has been notified.");
    await supabase.from("exam_exit_events").insert({ user_id: userRef.current, department: deptRef.current, reason });
  }, []);

  useEffect(() => {
    if (!started) return;
    const block = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "printscreen" || ((e.ctrlKey || e.metaKey) && ["p", "s", "c", "u", "a"].includes(k)) || (e.metaKey && e.shiftKey) || k === "f12") {
        e.preventDefault();
        if (k === "printscreen") { navigator.clipboard?.writeText("").catch(() => {}); logExit("Tried to take a screenshot"); }
      }
    };
    const onVis = () => { if (document.hidden) { setHidden(true); logExit("Switched tab or minimized the exam"); } else setHidden(false); };
    const onBlur = () => { setHidden(true); logExit("Left the exam window"); };
    const onFocus = () => setHidden(false);
    const onFs = () => { if (!document.fullscreenElement) logExit("Exited full screen"); };
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("beforeunload", onUnload);
    history.pushState(null, "", location.href);
    const onPop = () => { history.pushState(null, "", location.href); logExit("Tried to go back"); };
    window.addEventListener("popstate", onPop);
    document.body.classList.add("secure-exam");
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("popstate", onPop);
      document.body.classList.remove("secure-exam");
    };
  }, [started, logExit]);

  const startExam = async () => {
    try { await document.documentElement.requestFullscreen?.(); } catch { /* some phones don't support it */ }
    setStarted(true);
  };
  const finishSecure = async () => {
    setStarted(false);
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) return toast.error("Please answer all questions before submitting");
    const tally: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q) => {
      tally[q.dept] ??= { correct: 0, total: 0 };
      tally[q.dept].total++;
      if (answers[q.id] === q.answer) tally[q.dept].correct++;
    });
    const scores = Object.fromEntries(Object.entries(tally).map(([k, v]) => [k, Math.round((v.correct / v.total) * 100)]));
    const ranked = Object.entries(scores).filter(([k]) => k !== "General")
      .sort((a, b) => b[1] - a[1]);
    const recommended = ranked.slice(0, 1).map(([k]) => k);
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/auth");
    const { error } = await supabase.from("psychometric_results").insert({
      user_id: user.id, answers, scores, recommended_departments: recommended,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    await finishSecure();
    toast.success("Exam completed! View your department fit on your dashboard.");
    setTimeout(() => navigate("/student-dashboard"), 1200);
  };

  if (blocked) return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-grow flex items-center justify-center px-4">
        <Card className="max-w-lg w-full"><CardHeader><CardTitle>Exam Not Available</CardTitle>
          <CardDescription>Your application must be eligible or approved by an admin before you can take the exam.</CardDescription>
        </CardHeader><CardContent><Button onClick={() => navigate("/student-dashboard")}>Back to Dashboard</Button></CardContent></Card>
      </main><Footer /></div>
  );

  if (windowMsg) return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-grow flex items-center justify-center px-4">
        <Card className="max-w-lg w-full"><CardHeader><CardTitle>Exam Not Open</CardTitle>
          <CardDescription>{windowMsg}</CardDescription>
        </CardHeader><CardContent><Button onClick={() => navigate("/student-dashboard")}>Back to Dashboard</Button></CardContent></Card>
      </main><Footer /></div>
  );

  if ((exam || choices) && !started) return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-grow flex items-center justify-center px-4">
        <Card className="max-w-lg w-full"><CardHeader><CardTitle>Secure Exam Rules</CardTitle>
          <CardDescription>Read carefully before you start.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>The exam opens in full screen.</li>
              <li>Do not leave the page, switch tabs, minimize, or exit full screen.</li>
              <li>Every exit is reported to your department head.</li>
              <li>Screenshots, copying and right-click are blocked.</li>
              <li>Each student gets questions and answers in a different order.</li>
            </ul>
            <Button className="w-full" onClick={startExam}>Start Exam</Button>
          </CardContent></Card>
      </main><Footer /></div>
  );

  const shield = hidden && (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6 text-center">
      <div><p className="text-xl font-bold text-destructive">Return to the exam</p>
        <p className="text-muted-foreground mt-2">Leaving the exam was reported to your department head.</p></div>
    </div>
  );

  if (exam) {
    const embed = exam.form_url.includes("docs.google.com/forms")
      ? exam.form_url.replace(/\/viewform.*$/, "/viewform") + "?embedded=true" : null;
    return (
      <div className="min-h-screen flex flex-col">
        {shield}
        <main className="flex-grow container mx-auto px-4 py-10 select-none">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">{exam.title}</h1>
          {studentCode && (
            <p className="text-center mb-6">Your student code: <span className="font-mono font-bold text-primary">{studentCode}</span> — enter it in the exam.</p>
          )}
          {embed ? (
            <iframe src={embed} title={exam.title} className="w-full max-w-3xl mx-auto block h-[75vh] border rounded-lg" />
          ) : (
            <p className="text-center"><a href={exam.form_url} target="_blank" rel="noreferrer" className="text-primary underline">Open the exam</a></p>
          )}
          <div className="text-center mt-6">
            <Button onClick={async () => { await finishSecure(); navigate("/student-dashboard"); }}>I've submitted the exam</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!choices) return (
    <div className="min-h-screen flex flex-col"><Header /><main className="flex-grow flex items-center justify-center text-muted-foreground">Loading...</main><Footer /></div>
  );

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {shield}
      <main className="flex-grow select-none">
        <section className="py-16 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Aptitude & Psychometric Exam</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {questions.length} questions, focused on your chosen departments{choices.length ? `: ${choices.join(", ")}` : ""}. Choose the correct answer.
            </p>
            {studentCode && <p className="mt-3">Student code: <span className="font-mono font-bold text-primary">{studentCode}</span></p>}
            {exitCount > 0 && <p className="mt-2 text-destructive font-semibold">Exits recorded: {exitCount}</p>}
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle>Question {current + 1} of {questions.length}</CardTitle>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Badge variant="secondary">{q.dept}</Badge>
                <h3 className="text-xl font-semibold">{q.q}</h3>
                <RadioGroup value={answers[q.id]?.toString() ?? ""} onValueChange={(v) => setAnswers({ ...answers, [q.id]: Number(v) })}>
                  <div className="space-y-3">
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value={String(i)} id={`o${i}`} />
                        <Label htmlFor={`o${i}`} className="cursor-pointer flex-1">{String.fromCharCode(65 + i)}. {opt}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
                <div className="flex justify-between gap-4 pt-4">
                  <Button variant="outline" onClick={() => setCurrent(current - 1)} disabled={current === 0}>Previous</Button>
                  {current < questions.length - 1 ? (
                    <Button onClick={() => answers[q.id] === undefined ? toast.error("Please answer the question") : setCurrent(current + 1)}>Next</Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Submitting..." : "Submit Exam"}</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PsychometricExam;
