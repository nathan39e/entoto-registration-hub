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

const statusBadge = (s?: string | null) => {
  if (!s) return <Badge variant="outline">Not started</Badge>;
  if (s === "approved" || s === "completed") return <Badge className="capitalize">{s}</Badge>;
  if (s === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary" className="capitalize">{s}</Badge>;
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [app, setApp] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/auth");
      const uid = session.user.id;
      const [p, a, pay, r] = await Promise.all([
        supabase.from("profiles").select("full_name, student_code").eq("id", uid).maybeSingle(),
        supabase.from("applications").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("payments").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("psychometric_results").select("*").eq("user_id", uid).order("completed_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (p.error) toast.error("Failed to load student information");
      setProfile(p.data); setApp(a.data); setPayment(pay.data); setResult(r.data);
    })();
  }, [navigate]);

  const recs: string[] = Array.isArray(result?.recommended_departments)
    ? result.recommended_departments.map((d: any) => (typeof d === "string" ? d : d?.name ?? String(d))) : [];
  const approved = app?.status === "approved" && payment?.status === "completed";
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

            {recs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Departments</CardTitle>
                  <CardDescription>Based on your psychometric test results</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {recs.map((d) => <Badge key={d} variant="outline" className="text-base py-1">{d}</Badge>)}
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/application")}>{app ? "View My Application" : "Apply Now"}</Button>
              {app && !result && <Button size="lg" variant="outline" onClick={() => navigate("/psychometric-exam")}>Take Psychometric Exam</Button>}
              {(!payment || payment.status === "rejected") && <Button size="lg" variant="outline" onClick={() => navigate("/payment")}>Proceed to Payment</Button>}
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
