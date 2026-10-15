import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Search, X } from "lucide-react";

/** Scans a student's QR (TMPC:<code>). Pass `department` to limit results to that department (department heads). */
const StudentQRScanner = ({ department }: { department?: string }) => {
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scanner = useRef<Html5Qrcode | null>(null);
  const regionId = useRef(`qr-${Math.random().toString(36).slice(2)}`).current;

  const stop = async () => {
    try { if (scanner.current?.isScanning) await scanner.current.stop(); } catch { /* ignore */ }
    setScanning(false);
  };
  useEffect(() => () => { stop(); }, []);

  const lookup = async (raw: string) => {
    const code = raw.trim().replace(/^TMPC:/i, "").toUpperCase();
    setError(null); setResult(null);
    if (!code) return;
    setLoading(true);
    const { data: prof } = await supabase.from("profiles").select("*").eq("student_code", code).maybeSingle();
    if (!prof) { setLoading(false); return setError(department ? "Student not found in your department." : "No student found with this code."); }
    const [{ data: app }, { data: pl }, { data: pay }] = await Promise.all([
      supabase.from("applications").select("*").eq("user_id", prof.id).maybeSingle(),
      supabase.from("department_placements").select("*").eq("user_id", prof.id).maybeSingle(),
      department ? Promise.resolve({ data: null }) : supabase.from("payments").select("status, amount, program").eq("user_id", prof.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setLoading(false);
    if (department) {
      const depts = [app?.first_department, pl?.current_department, pl?.placed_department];
      if (!depts.includes(department)) return setError("This student is not under your department.");
    }
    setResult({ prof, app, pl, pay });
  };

  const start = async () => {
    setError(null); setResult(null); setScanning(true);
    await new Promise((r) => setTimeout(r, 50));
    try {
      scanner.current = new Html5Qrcode(regionId);
      await scanner.current.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, async (text) => { await stop(); lookup(text); }, () => {});
    } catch {
      setScanning(false); setError("Could not open the camera. Allow camera access or type the student code.");
    }
  };

  const pi = result?.app?.grade_12_results?.personal_info ?? {};
  const row = (k: string, v: any) => v ? <div className="flex justify-between gap-3 border-b py-1 text-sm"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{String(v)}</span></div> : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" />Scan Student QR{department ? ` — ${department}` : ""}</CardTitle>
        <CardDescription>{department ? "Only students under your department can be viewed." : "Scan any student's ID card or slip QR code."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {scanning ? <Button variant="outline" onClick={stop}><X className="mr-2 h-4 w-4" />Stop camera</Button>
            : <Button onClick={start}><QrCode className="mr-2 h-4 w-4" />Open camera</Button>}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); lookup(manual); }}>
            <Input placeholder="Or type student code" value={manual} onChange={(e) => setManual(e.target.value)} className="max-w-xs" />
            <Button type="submit" variant="secondary"><Search className="h-4 w-4" /></Button>
          </form>
        </div>
        <div id={regionId} className={scanning ? "max-w-sm overflow-hidden rounded-md border" : "hidden"} />
        {loading && <p className="text-sm text-muted-foreground">Looking up student...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            {result.prof.profile_picture_url && <img src={result.prof.profile_picture_url} alt="" className="h-32 w-32 rounded-md object-cover border" />}
            <div>
              <p className="text-lg font-bold">{result.prof.full_name}</p>
              <p className="text-primary font-semibold" data-no-translate>{result.prof.student_code}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.app && <Badge variant="outline">Application: {result.app.status === "waiting_list" ? "Waiting list" : result.app.status}</Badge>}
                {result.pl && <Badge>Placement: {result.pl.decision.replace("_", " ")}</Badge>}
                {result.pay && <Badge variant="secondary">Payment: {result.pay.status}</Badge>}
              </div>
              <div className="mt-3">
                {row("Email", result.prof.email)}
                {row("Phone", result.prof.phone ?? pi.phone)}
                {row("Gender", pi.gender)}
                {row("Program", result.app?.program)}
                {row("Grade 12 result", result.app?.grade_12_results?.score)}
                {row("1st choice", result.app?.first_choice)}
                {row("2nd choice", result.app?.second_choice)}
                {row("3rd choice", result.app?.third_choice)}
                {row("Current department", result.pl?.current_department)}
                {row("Placed in", result.pl?.placed_department && `${result.pl.placed_department}${result.pl.placed_field ? ` — ${result.pl.placed_field}` : ""}`)}
                {row("Entry exam score", result.pl?.exam_score)}
                {row("City", pi.city)}{row("Sub city", pi.subcity)}{row("Wereda", pi.wereda)}
                {row("Emergency contact", pi.emergency_name && `${pi.emergency_name} ${pi.emergency_phone ?? ""}`)}
                {row("Applied on", result.app && new Date(result.app.submitted_at).toLocaleDateString())}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentQRScanner;
