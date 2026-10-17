import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Attempt, Grade, PortalExam } from "@/lib/portalExams";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function StudentPortalExams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<PortalExam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const [e, a, g] = await Promise.all([supabase.from("portal_exams").select("*").eq("published", true), supabase.from("portal_exam_attempts").select("*").eq("user_id", user.id), supabase.from("portal_exam_grades").select("*").eq("published", true)]);
    if (e.error || a.error || g.error) return toast.error("Could not load department exams");
    setExams(e.data ?? []); setAttempts(a.data ?? []); setGrades(g.data ?? []);
    // Closed exams remain visible when the student has an attempt, without exposing other exams.
    const missing = (a.data ?? []).map((x) => x.exam_id).filter((id) => !e.data?.some((x) => x.id === id));
    if (missing.length) { const { data } = await supabase.from("portal_exams").select("*").in("id", missing); setExams((old) => [...old, ...(data ?? [])]); }
  })(); }, []);
  if (!exams.length && !attempts.length) return null;
  return <section className="border-t pt-6 space-y-4"><h2 className="text-xl font-semibold">Department Portal Exams</h2>{exams.map((e) => {
    const a = attempts.find((x) => x.exam_id === e.id); const g = grades.find((x) => x.attempt_id === a?.id);
    const ended = a && (a.submitted_at || new Date(a.deadline).getTime() <= Date.now());
    const unavailable = !e.published || (e.opens_at && Date.now() < new Date(e.opens_at).getTime()) || (e.closes_at && Date.now() >= new Date(e.closes_at).getTime());
    return <div key={e.id} className="border-b py-4 space-y-2"><div className="flex flex-wrap justify-between items-center gap-3"><div><h3 className="font-semibold">{e.title}</h3><p className="text-sm text-muted-foreground">{e.department} · {e.duration_minutes} minutes</p></div>{g ? <strong className="text-primary">Grade: {g.total}/{g.maximum}</strong> : ended ? <span className="text-muted-foreground">Submitted · Awaiting grade</span> : <Button disabled={!a && !!unavailable} onClick={() => navigate(`/department-exam/${e.id}`)}>{a ? "Resume Exam" : unavailable ? "Not Open" : "Take Exam"}</Button>}</div>{e.opens_at && <p className="text-sm">Opens: {new Date(e.opens_at).toLocaleString()}</p>}{e.closes_at && <p className="text-sm">Closes: {new Date(e.closes_at).toLocaleString()}</p>}{g?.feedback && <p className="whitespace-pre-wrap">{g.feedback}</p>}</div>;
  })}{attempts.filter((a) => !exams.some((e) => e.id === a.exam_id)).map((a) => { const g = grades.find((x) => x.attempt_id === a.id); return <div key={a.id} className="border-b py-3"><h3 className="font-semibold">Closed Department Exam</h3><p>{g ? `Grade: ${g.total}/${g.maximum}` : "Awaiting grade"}</p>{g?.feedback && <p>{g.feedback}</p>}</div>; })}</section>;
}