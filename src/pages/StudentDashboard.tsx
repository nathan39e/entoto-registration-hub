import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RegistrationSlip from "@/components/RegistrationSlip";
import { DEPARTMENTS } from "@/data/departments";

const statusBadge = (s?: string | null) => {
  if (!s) return <Badge variant="outline">Not started</Badge>;
  if (s === "approved" || s === "completed") return <Badge className="capitalize">{s}</Badge>;
  if (s === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  if (s === "waiting_list") return <Badge variant="secondary">Waiting list</Badge>;
  if (s === "pending") return <Badge variant="secondary">Document review</Badge>;
  return <Badge variant="secondary" className="capitalize">{s}</Badge>;
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [app, setApp] = useState<any>(null);
  const [deptExams, setDeptExams] = useState<any[]>([]);
  const [payment, setPayment] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/auth");
      const uid = session.user.id;
      const { data: adminRole } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
      if (adminRole) return navigate("/admin-dashboard", { replace: true });
      const [p, a, pay, r] = await Promise.all([
        supabase.from("profiles").select("full_name, student_code, exam_required").eq("id", uid).maybeSingle(),
        supabase.from("applications").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("payments").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("psychometric_results").select("*").eq("user_id", uid).order("completed_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (p.error) toast.error("Failed to load student information");
      if (p.data?.exam_required && !r.data && a.data && !["waiting_list", "rejected"].includes(a.data.status ?? "pending")) {
        toast.info("Please take your psychometric exam first.");
        return navigate("/psychometric-exam");
      }
      if (a.data) supabase.from("department_exams").select("id, title, form_url, department").eq("is_active", true).then(({ data }) => setDeptExams(data ?? []));
      setProfile(p.data); setApp(a.data); setPayment(pay.data); setResult(r.data);
    })();
  }, [navigate]);

  const selected: string[] = [app?.first_choice, app?.second_choice, app?.third_choice]
    .filter((choice): choice is string => typeof choice === "string" && choice.length > 0);
  const scores = result?.scores && typeof result.scores === "object" ? result.scores as Record<string, number> : null;
  const bestFit = scores
    ? Object.keys(scores).filter((name) => name !== "General" && DEPARTMENTS.includes(name) && typeof scores[name] === "number")
        .sort((a, b) => scores[b] - scores[a])[0]
    : null;
  const approved = app?.status === "approved" && payment?.status === "completed";
  const canContinue = !!app && !["waiting_list", "rejected"].includes(app.status);
  const payStatus = payment?.status === "completed" ? "completed" : payment?.status === "rejected" ? "rejected" : payment ? "awaiting verification" : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-16 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Student Dashboard</h1>
            <p className="text-xl text-muted-foreground">Welcome back, {profile?.full_name || "Student"}!</p>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 space-y-6">
            {approved && (
              <RegistrationSlip name={profile?.full_name ?? ""} code={profile?.student_code ?? ""}
                department={app.first_choice} amount={Number(payment.amount)} approvedAt={payment.paid_at} />
            )}
            {app?.status === "waiting_list" && (
              <Card className="border-accent">
                <CardHeader>
                  <CardTitle>Waiting List</CardTitle>
                  <CardDescription>Your Grade 12 result is below the current minimum. An admin must approve your application before you continue.</CardDescription>
                </CardHeader>
              </Card>
            )}
            {app?.status === "pending" && (
              <Card className="border-primary/40">
                <CardHeader>
                  <CardTitle>Documents Under Review</CardTitle>
                  <CardDescription>You may continue while an admin manually checks that your uploaded documents are genuine.</CardDescription>
                </CardHeader>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Student Code</CardTitle>
                  <CardDescription>Use this code to access your exam and identify yourself</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2 break-all">{profile?.student_code}</div>
                  <p className="text-sm text-muted-foreground">Keep this code safe</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                  <CardDescription>Your progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center"><span>Application Form</span>{statusBadge(app?.status)}</div>
                  <div className="flex justify-between items-center"><span>Psychometric Test</span>{statusBadge(result ? "completed" : null)}</div>
                  <div className="flex justify-between items-center"><span>Payment</span>{statusBadge(payStatus)}</div>
                </CardContent>
              </Card>
            </div>

            {selected.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Department Choices</CardTitle>
                  <CardDescription>Selected on your application, in order of preference</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selected.map((choice, index) => <p key={index} className="text-sm"><span className="font-semibold">{index + 1}.</span> {choice}</p>)}
                </CardContent>
              </Card>
            )}

            {canContinue && deptExams.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{app.first_department} Entry Exam</CardTitle>
                  <CardDescription>Set by your department head. Use your student code {profile?.student_code} when filling the form.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {deptExams.map((e) => <Button key={e.id} asChild><a href={e.form_url} target="_blank" rel="noopener noreferrer">{e.title}</a></Button>)}
                </CardContent>
              </Card>
            )}

            {bestFit && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Strongest Exam Fit</CardTitle>
                  <CardDescription>Your highest-scoring department on the exam</CardDescription>
                </CardHeader>
                <CardContent><Badge variant="outline" className="text-base py-1">{bestFit}</Badge></CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/application")}>{app ? "View My Application" : "Apply Now"}</Button>
              {canContinue && !result && <Button size="lg" variant="outline" onClick={() => navigate("/psychometric-exam")}>Take Psychometric Exam</Button>}
              {canContinue && result && (!payment || payment.status === "rejected") && <Button size="lg" variant="outline" onClick={() => navigate("/payment")}>Proceed to Payment</Button>}
              <Button size="lg" variant="outline" onClick={() => navigate("/portfolio")}>View Portfolio</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
