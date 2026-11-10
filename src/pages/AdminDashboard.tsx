import { fetchAll } from "@/lib/fetchAll";
import { privateDocUrl } from "@/lib/privateDoc";
import GenderStats from "@/components/GenderStats";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast as notify } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VisitorsTab from "@/components/admin/VisitorsTab";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, CreditCard, TrendingUp, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StudentsTab from "@/components/admin/StudentsTab";
import ExamFormsTab from "@/components/admin/ExamFormsTab";
import SubAdminsTab from "@/components/admin/SubAdminsTab";
import DepartmentHeadsTab from "@/components/admin/DepartmentHeadsTab";
import NewsTab from "@/components/admin/NewsTab";
import StudentQRScanner from "@/components/StudentQRScanner";
import AdminsTab from "@/components/admin/AdminsTab";

interface Application {
  id: string;
  user_id: string;
  first_choice: string;
  second_choice: string;
  third_choice: string;
  status: string;
  submitted_at: string;
  result_doc_path?: string | null;
  grade_12_results: { score?: number } | null;
  profiles: { full_name: string; email: string; student_code: string };
}

interface PsychometricResult {
  id: string;
  user_id: string;
  completed_at: string;
  scores: any;
  recommended_departments: any;
  profiles: { full_name: string; email: string; student_code: string };
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id: string;
  receipt_path?: string | null;
  program?: string | null;
  paid_at: string;
  created_at: string;
  profiles: { full_name: string; email: string; student_code: string };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [results, setResults] = useState<PsychometricResult[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [programFilter, setProgramFilter] = useState("All");
  const [cutoff, setCutoff] = useState(160);
  const [cutoffDraft, setCutoffDraft] = useState("160");
  const [femaleCutoff, setFemaleCutoff] = useState(150);
  const [femaleDraft, setFemaleDraft] = useState("150");
  const [savingCutoff, setSavingCutoff] = useState(false);
  const [examStart, setExamStart] = useState("");
  const [examEnd, setExamEnd] = useState("");
  const toLocal = (v?: string | null) => { if (!v) return ""; const d = new Date(v); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const saveExamWindow = async () => {
    if (examStart && examEnd && new Date(examEnd) <= new Date(examStart)) return toast({ title: "End must be after start", variant: "destructive" });
    const { error } = await supabase.from("admission_settings").update({ exam_start: examStart ? new Date(examStart).toISOString() : null, exam_end: examEnd ? new Date(examEnd).toISOString() : null }).eq("id", true);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Exam schedule saved" });
  };
  const knownPaymentIds = useRef<Set<string> | null>(null);
  const [tab, setTab] = useState("students");
  const studentsRef = useRef<HTMLDivElement>(null);
  const [studentStatus, setStudentStatus] = useState<{ value: string; n: number }>({ value: "All", n: 0 });
  const [signedUpOnly, setSignedUpOnly] = useState(0);
  const [filledCount, setFilledCount] = useState(0);
  const [genders, setGenders] = useState<(string | null)[]>([]);

  const goToStudents = () => {
    setTab("students");
    window.setTimeout(() => {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      studentsRef.current?.scrollIntoView({ behavior, block: "start" });
    }, 80);
  };


  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsResponse, resultsResponse, paymentsResponse, profilesResponse, settingsResponse, staffResponse] = await Promise.all([
        fetchAll(() => supabase.from("applications").select("*").order("submitted_at", { ascending: false }).order("id")),
        fetchAll(() => supabase.from("psychometric_results").select("*").order("completed_at", { ascending: false }).order("id")),
        fetchAll(() => supabase.from("payments").select("*").order("created_at", { ascending: false }).order("id")),
        fetchAll(() => supabase.from("profiles").select("id, full_name, email, student_code").order("id")),
        supabase.from("admission_settings").select("grade_12_cutoff, female_grade_12_cutoff, exam_start, exam_end").eq("id", true).maybeSingle(),
        fetchAll(() => supabase.from("user_roles").select("user_id").in("role", ["admin", "sub_admin", "department_head", "viewer"]).order("id")),
      ]);
      const map = new Map((profilesResponse.data ?? []).map((p) => [p.id, p]));
      const staffIds = new Set((staffResponse.data ?? []).map((r) => r.user_id));
      const appliedIds = new Set((appsResponse.data ?? []).map((a) => a.user_id));
      setSignedUpOnly((profilesResponse.data ?? []).filter((p) => !staffIds.has(p.id) && !appliedIds.has(p.id)).length);
      setFilledCount((appsResponse.data ?? []).filter((a) => !staffIds.has(a.user_id)).length);
      setGenders((appsResponse.data ?? []).filter((a) => !staffIds.has(a.user_id)).map((a) => ((a.grade_12_results as { personal_info?: { gender?: string } } | null)?.personal_info?.gender ?? null)));
      const empty = { full_name: "Unknown", email: "", student_code: "-" };
      const attach = (rows: any[] | null) => (rows ?? []).map((r) => ({ ...r, profiles: map.get(r.user_id) ?? empty }));
      setApplications(attach(appsResponse.data));
      setResults(attach(resultsResponse.data));
      setPayments(attach(paymentsResponse.data));
      const currentCutoff = Number(settingsResponse.data?.grade_12_cutoff ?? 160);
      setCutoff(currentCutoff);
      setCutoffDraft(String(currentCutoff));
      const currentFemale = Number(settingsResponse.data?.female_grade_12_cutoff ?? 150);
      setFemaleCutoff(currentFemale);
      setFemaleDraft(String(currentFemale));
      setExamStart(toLocal(settingsResponse.data?.exam_start));
      setExamEnd(toLocal(settingsResponse.data?.exam_end));
      const pending = (paymentsResponse.data ?? []).filter((p) => p.status === "pending");
      if (knownPaymentIds.current) {
        const newlySubmitted = pending.filter((p) => !knownPaymentIds.current?.has(p.id));
        if (newlySubmitted.length) toast({ title: "New payment receipt", description: `${newlySubmitted.length} student${newlySubmitted.length > 1 ? "s have" : " has"} submitted a receipt for approval.` });
      }
      knownPaymentIds.current = new Set((paymentsResponse.data ?? []).map((p) => p.id));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    const refreshPayments = async () => {
      if (document.visibilityState !== "visible") return;
      const { data, error } = await fetchAll(() => supabase.from("payments").select("*").order("created_at", { ascending: false }).order("id"));
      if (error || !data) return;
      const newReceipts = data.filter((p) => p.status === "pending" && !knownPaymentIds.current?.has(p.id));
      if (newReceipts.length) {
        toast({ title: "New payment receipt", description: `${newReceipts.length} student${newReceipts.length > 1 ? "s have" : " has"} submitted a receipt for approval.` });
      }
      knownPaymentIds.current = new Set(data.map((p) => p.id));
      const ids = data.map((p) => p.user_id);
      const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, full_name, email, student_code").in("id", ids) : { data: [] };
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      setPayments(data.map((p) => ({ ...p, profiles: byId.get(p.user_id) ?? { full_name: "Unknown", email: "", student_code: "-" } })));
    };
    const timer = window.setInterval(refreshPayments, 15000);
    document.addEventListener("visibilitychange", refreshPayments);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refreshPayments); };
  }, [loading, toast]);

  const [docUrl, setDocUrl] = useState<string | null>(null);

  const setAppStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setApplications((a) => a.map((x) => (x.id === id ? { ...x, status } : x)));
    toast({ title: `Application ${status}` });
  };

  const removeApplication = async (id: string) => {
    if (!window.confirm("Remove this application permanently? The student will be able to apply again.")) return;
    await supabase.from("department_placements").delete().eq("application_id", id);
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setApplications((a) => a.filter((x) => x.id !== id));
    toast({ title: "Application removed" });
  };

  const removeResult = async (id: string) => {
    if (!window.confirm("Remove this test result permanently? The student will be able to retake the exam.")) return;
    const { error } = await supabase.from("psychometric_results").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setResults((r) => r.filter((x) => x.id !== id));
    toast({ title: "Test result removed" });
  };

  const saveCutoff = async () => {
    const next = Number(cutoffDraft);
    const nextF = Number(femaleDraft);
    const bad = (n: number) => !Number.isFinite(n) || n < 0 || n > 700;
    if (bad(next) || bad(nextF)) {
      return toast({ title: "Invalid mark", description: "Enter marks from 0 to 700.", variant: "destructive" });
    }
    setSavingCutoff(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("admission_settings").update({
      grade_12_cutoff: next,
      female_grade_12_cutoff: nextF,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    }).eq("id", true);
    setSavingCutoff(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setCutoff(next);
    setFemaleCutoff(nextF);
    await fetchData();
    toast({ title: "Admission marks updated", description: `Male minimum ${next}, female minimum ${nextF}. Waiting-list applications were recalculated.` });
  };

  const setPaymentStatus = async (id: string, status: string) => {
    const paid_at = status === "completed" ? new Date().toISOString() : null;
    const { error } = await supabase.from("payments").update({ status, paid_at }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setPayments((p) => p.map((x) => (x.id === id ? { ...x, status, paid_at } : x)));
    toast({ title: status === "completed" ? "Payment verified" : "Payment rejected" });
  };

  const viewDoc = async (path?: string | null) => {
    if (!path) return toast({ title: "No document", description: "This application has no uploaded result photo." });
    try { setDocUrl(await privateDocUrl(path)); }
    catch (e) { return toast({ title: "Error", description: (e as Error).message, variant: "destructive" }); }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "waiting_list":
        return "bg-accent/10 text-accent border-accent/20";
      case "approved":
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const stats: { title: string; value: number; icon: LucideIcon; description: string; onSelect?: () => void; actions?: ReactNode }[] = [
    {
      title: "Total Applications",
      value: applications.length,
      icon: FileText,
      description: `${applications.filter(a => a.status === "pending").length} pending · ${signedUpOnly} sign-up only`,
      onSelect: goToStudents,
      actions: (
        <>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setStudentStatus((s) => ({ value: "applied_any", n: s.n + 1 })); goToStudents(); }}>Filled form ({filledCount})</Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setStudentStatus((s) => ({ value: "not_applied", n: s.n + 1 })); goToStudents(); }}>Sign-up only ({signedUpOnly})</Button>
        </>
      ),
    },

    {
      title: "Test Results",
      value: results.length,
      icon: TrendingUp,
      description: "Completed assessments",
    },
    {
      title: "Total Payments",
      value: payments.length,
      icon: CreditCard,
      description: `${payments.filter(p => p.status === "completed").length} completed`,
    },
    {
      title: "Total Students",
      value: new Set([...applications.map(a => a.user_id), ...results.map(r => r.user_id)]).size,
      icon: Users,
      description: "Unique users",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 min-w-0 max-w-full overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage student applications, test results, and payments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const interactive = Boolean(stat.onSelect);
            return (
              <Card
                key={stat.title}
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-label={interactive ? `${stat.title} — open the registered students list` : undefined}
                onClick={stat.onSelect}
                onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stat.onSelect!(); } } : undefined}
                className={interactive ? "cursor-pointer transition-all hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : ""}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  {stat.actions && <div className="flex flex-wrap gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>{stat.actions}</div>}
                  {interactive && <p className="text-xs font-medium text-primary mt-2">View registered students ↓</p>}
                </CardContent>
              </Card>
            );
          })}

        </div>
        <GenderStats genders={genders} className="mb-8" />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Grade 12 Admission Mark</CardTitle>
            <CardDescription>Students at or above this mark are approved automatically; students below it join the waiting list. Changing it recalculates applications that have not received a final admin decision.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-xl">
              <div className="space-y-2 flex-1">
                <Label htmlFor="admission-cutoff">Male minimum</Label>
                <Input id="admission-cutoff" type="number" min={0} max={700} step="0.01" value={cutoffDraft} onChange={(event) => setCutoffDraft(event.target.value)} />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="admission-cutoff-female">Female minimum</Label>
                <Input id="admission-cutoff-female" type="number" min={0} max={700} step="0.01" value={femaleDraft} onChange={(event) => setFemaleDraft(event.target.value)} />
              </div>
              <Button onClick={saveCutoff} disabled={savingCutoff}>{savingCutoff ? "Saving..." : "Save Marks"}</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">Current minimum: male {cutoff}, female {femaleCutoff}</p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Psychometric Exam Schedule</CardTitle>
            <CardDescription>Students can only start the exam between these dates and times. Leave empty for no limit.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-2xl">
              <div className="space-y-2 flex-1"><Label htmlFor="exam-start">Opens</Label><Input id="exam-start" type="datetime-local" value={examStart} onChange={(e) => setExamStart(e.target.value)} /></div>
              <div className="space-y-2 flex-1"><Label htmlFor="exam-end">Closes</Label><Input id="exam-end" type="datetime-local" value={examEnd} onChange={(e) => setExamEnd(e.target.value)} /></div>
              <Button onClick={saveExamWindow}>Save Schedule</Button>
            </div>
          </CardContent>
        </Card>


        <div className="mb-8"><StudentQRScanner /></div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto w-full gap-1">
            <TabsTrigger value="students" className="flex-1 min-w-[7rem]">Students</TabsTrigger>
            <TabsTrigger value="subadmins" className="flex-1 min-w-[7rem]">Sub Admins</TabsTrigger>
            <TabsTrigger value="admins" className="flex-1 min-w-[7rem]">Admins</TabsTrigger>
            <TabsTrigger value="applications" className="flex-1 min-w-[7rem]">Applications</TabsTrigger>
            <TabsTrigger value="results" className="flex-1 min-w-[7rem]">Test Results</TabsTrigger>
            <TabsTrigger value="exams" className="flex-1 min-w-[7rem]">Exams</TabsTrigger>
            <TabsTrigger value="heads" className="flex-1 min-w-[7rem]">Dept Heads</TabsTrigger>
            <TabsTrigger value="news" className="flex-1 min-w-[7rem]">News</TabsTrigger>
            <TabsTrigger value="visitors" className="flex-1 min-w-[7rem]">Visitors</TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 min-w-[7rem]">Payments {payments.filter((p) => p.status === "pending").length > 0 && <Badge variant="destructive" className="ml-2">{payments.filter((p) => p.status === "pending").length}</Badge>}</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6"><div ref={studentsRef} id="registered-students" className="scroll-mt-28"><StudentsTab statusPreset={studentStatus} /></div></TabsContent>
          <TabsContent value="subadmins" className="mt-6"><SubAdminsTab /></TabsContent>
          <TabsContent value="admins" className="mt-6"><AdminsTab /></TabsContent>
          <TabsContent value="exams" className="mt-6"><ExamFormsTab /></TabsContent>
          <TabsContent value="heads" className="mt-6"><DepartmentHeadsTab /></TabsContent>
          <TabsContent value="news" className="mt-6"><NewsTab /></TabsContent>
          <TabsContent value="visitors" className="mt-6"><VisitorsTab /></TabsContent>


          <TabsContent value="applications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Applications</CardTitle>
                <CardDescription>Review and manage student applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] w-full max-w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student Code</TableHead>
                        <TableHead>First Choice</TableHead>
                        <TableHead>Second Choice</TableHead>
                        <TableHead>Third Choice</TableHead>
                        <TableHead>Grade 12</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{app.profiles.full_name}</div>
                              <div className="text-xs text-muted-foreground">{app.profiles.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{app.profiles.student_code}</TableCell>
                          <TableCell>{app.first_choice}</TableCell>
                          <TableCell>{app.second_choice}</TableCell>
                          <TableCell>{app.third_choice}</TableCell>
                          <TableCell>{app.grade_12_results?.score ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(app.status)}>
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(app.submitted_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 min-w-[16rem]">
                              <Button size="sm" variant="outline" onClick={() => viewDoc(app.result_doc_path)}>Grade 12</Button>
                              <Button size="sm" disabled={app.status === "approved"} onClick={() => setAppStatus(app.id, "approved")}>Approve</Button>
                              <Button size="sm" variant="outline" disabled={app.status === "pending"} onClick={() => setAppStatus(app.id, "pending")}>{app.status === "approved" ? "Unapprove" : "Review"}</Button>
                              <Button size="sm" variant="secondary" disabled={app.status === "waiting_list"} onClick={() => setAppStatus(app.id, "waiting_list")}>Waiting List</Button>
                              <Button size="sm" variant="destructive" disabled={app.status === "rejected"} onClick={() => setAppStatus(app.id, "rejected")}>Reject</Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => removeApplication(app.id)}>Remove</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Psychometric Test Results</CardTitle>
                <CardDescription>View student assessment results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] w-full max-w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student Code</TableHead>
                        <TableHead>Recommended Departments</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{result.profiles.full_name}</div>
                              <div className="text-xs text-muted-foreground">{result.profiles.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{result.profiles.student_code}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(result.recommended_departments) &&
                                result.recommended_departments.slice(0, 2).map((dept: string, idx: number) => (
                                  <Badge key={idx} variant="secondary">
                                    {dept}
                                  </Badge>
                                ))}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(result.completed_at).toLocaleDateString()}</TableCell>
                          <TableCell><Button size="sm" variant="destructive" onClick={() => removeResult(result.id)}>Remove</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Tracking</CardTitle>
                <CardDescription>New receipts appear here for your approval. Open each receipt and verify its transaction before approving. Regular: 350 ETB · Extension/Weekend: 1700 ETB.</CardDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  {["All", "Regular", "Extension", "Weekend"].map((p) => (
                    <Button key={p} size="sm" variant={programFilter === p ? "default" : "outline"} onClick={() => setProgramFilter(p)}>
                      {p} ({p === "All" ? payments.length : payments.filter((x) => (x.program ?? "Regular") === p).length})
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                 <div className="max-h-[500px] w-full max-w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student Code</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.filter((p) => programFilter === "All" || (p.program ?? "Regular") === programFilter).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{payment.profiles.full_name}</div>
                              <div className="text-xs text-muted-foreground">{payment.profiles.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{payment.profiles.student_code}</TableCell>
                          <TableCell>{payment.program ?? "Regular"}</TableCell>
                          <TableCell>{payment.amount} ETB</TableCell>
                          <TableCell className="capitalize">{payment.payment_method}</TableCell>
                          <TableCell className="text-xs">{payment.transaction_id || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" disabled={!payment.receipt_path} onClick={() => viewDoc(payment.receipt_path)}>Receipt</Button>
                              <Button size="sm" disabled={payment.status === "completed"} onClick={() => setPaymentStatus(payment.id, "completed")}>Verify</Button>
                              <Button size="sm" variant="destructive" disabled={payment.status === "rejected"} onClick={() => setPaymentStatus(payment.id, "rejected")}>Reject</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <Dialog open={!!docUrl} onOpenChange={(o) => !o && setDocUrl(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Document</DialogTitle></DialogHeader>
            {docUrl && <img src={docUrl} alt="Uploaded document" className="w-full max-h-[75vh] object-contain" />}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
