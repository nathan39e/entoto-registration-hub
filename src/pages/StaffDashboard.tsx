import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import RegisterStudentForm from "@/components/admin/RegisterStudentForm";

const DOCS: [string, string][] = [["photo", "Photo"], ["grade12", "Grade 12 Result"], ["grade8", "Grade 8 Result"], ["transcript", "Transcript"]];

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  const [code, setCode] = useState("");
  const [found, setFound] = useState<{ profile: any; app: any; result: any } | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return navigate("/auth");
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "sub_admin"]);
      if (!data?.length) { toast.error("Access denied"); return navigate("/"); }
      setOk(true);
    });
  }, [navigate]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true); setFound(null);
    const { data: profile } = await supabase.from("profiles").select("*").ilike("student_code", code.trim()).maybeSingle();
    if (!profile) return;
    const [{ data: app }, { data: result }] = await Promise.all([
      supabase.from("applications").select("*").eq("user_id", profile.id).maybeSingle(),
      supabase.from("psychometric_results").select("recommended_departments").eq("user_id", profile.id).limit(1).maybeSingle(),
    ]);
    setFound({ profile, app, result });
  };

  const open = async (path?: string) => {
    if (!path) return toast.error("Not uploaded");
    const { data, error } = await supabase.storage.from("result-docs").createSignedUrl(path, 600);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  if (!ok) return <div className="min-h-screen flex flex-col"><Header /><main className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</main><Footer /></div>;

  const docs = { ...(found?.app?.documents ?? {}) };
  if (!docs.grade12 && found?.app?.result_doc_path) docs.grade12 = found.app.result_doc_path;
  const pi = found?.app?.grade_12_results?.personal_info ?? {};

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-4xl font-bold">Staff Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Check a Student</CardTitle>
            <CardDescription>Enter the student code to see if they applied and view their documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={search} className="flex flex-wrap gap-2">
              <Input required placeholder="e.g. EPC1A2B3C4D" value={code} onChange={(e) => setCode(e.target.value)} className="max-w-sm" />
              <Button type="submit">Search</Button>
            </form>
            {searched && !found && <p className="text-muted-foreground">No student found with that code.</p>}
            {found && (
              <div className="space-y-3 border rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xl font-semibold">{found.profile.full_name}</span>
                  <Badge variant="outline">{found.profile.student_code}</Badge>
                  {found.app ? <Badge className="capitalize">Applied — {found.app.status}</Badge> : <Badge variant="destructive">Not applied</Badge>}
                  <Badge variant={found.result ? "default" : "secondary"}>{found.result ? "Exam done" : "Exam not taken"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{found.profile.email} · {found.profile.phone || pi.phone || "no phone"}{pi.program ? ` · ${pi.program}` : ""}</p>
                {found.app && (
                  <>
                    <p className="text-sm">Choices: {found.app.first_choice} / {found.app.second_choice} / {found.app.third_choice}</p>
                    <div className="flex flex-wrap gap-2">
                      {DOCS.map(([k, label]) => (
                        <Button key={k} size="sm" variant="outline" disabled={!docs[k]} onClick={() => open(docs[k])}>{label}</Button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <RegisterStudentForm />
      </main>
      <Footer />
    </div>
  );
};

export default StaffDashboard;
