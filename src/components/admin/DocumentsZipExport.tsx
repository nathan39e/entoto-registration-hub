import { useState } from "react";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEPARTMENTS } from "@/data/departments";
import { toast } from "sonner";

const DOCS: [string, string][] = [["photo", "photo"], ["grade12", "grade12_result"], ["grade8", "grade8_result"], ["transcript", "transcript"], ["manualForm", "manual_form"]];
const safe = (s: string) => (s || "unknown").replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 80) || "unknown";

const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

const DocumentsZipExport = () => {
  const [open, setOpen] = useState(false);
  const [dept, setDept] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const build = async () => {
    setBusy(true); setResult(null); setDone(0); setTotal(0);
    try {
      let q = supabase.from("applications").select("user_id, first_choice, documents, result_doc_path, submitted_at");
      if (dept !== "all") q = q.eq("first_choice", dept);
      if (from) q = q.gte("submitted_at", from);
      if (to) q = q.lte("submitted_at", `${to}T23:59:59`);
      const { data: apps, error } = await q;
      if (error) throw error;
      if (!apps?.length) { toast.error("No applications match this filter."); return; }
      const { data: profs } = await supabase.from("profiles").select("id, full_name, student_code").in("id", apps.map((a) => a.user_id));
      const pm = new Map((profs ?? []).map((p) => [p.id, p]));
      const jobs: { path: string; entry: string }[] = [];
      for (const a of apps) {
        const p = pm.get(a.user_id);
        const d: Record<string, string> = { ...((a.documents as Record<string, string>) ?? {}) };
        if (!d.grade12 && a.result_doc_path) d.grade12 = a.result_doc_path;
        const folder = `${safe(a.first_choice)}/${safe(p?.student_code ?? a.user_id)}_${safe(p?.full_name ?? "")}`;
        for (const [k, n] of DOCS) if (d[k]) jobs.push({ path: d[k], entry: `${folder}/${n}.${d[k].split(".").pop() || "jpg"}` });
      }
      if (!jobs.length) { toast.error("No uploaded documents found."); return; }
      setTotal(jobs.length);
      const zip = new JSZip();
      let failed = 0;
      for (let i = 0; i < jobs.length; i += 5) {
        await Promise.all(jobs.slice(i, i + 5).map(async (j) => {
          const { data, error } = await supabase.storage.from("result-docs").download(j.path);
          if (error || !data) failed++; else zip.file(j.entry, data);
          setDone((x) => x + 1);
        }));
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const name = `documents_${dept === "all" ? "all_departments" : safe(dept).replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.zip`;
      setResult({ blob, name });
      toast.success(`ZIP ready: ${jobs.length - failed} files${failed ? ` (${failed} could not be read)` : ""}.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <>
      <Button variant="outline" onClick={() => { setOpen(true); setResult(null); }}>Download Documents (ZIP)</Button>
      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Student Documents</DialogTitle>
            <DialogDescription>Files are grouped by the student's first-choice department.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Department</Label>
              <Select value={dept} onValueChange={setDept}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Applied from</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div className="space-y-1"><Label>Applied to</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            </div>
            {busy && total > 0 && (
              <div className="space-y-1"><Progress value={(done / total) * 100} /><p className="text-sm text-muted-foreground">Downloading document {done} of {total}...</p></div>
            )}
          </div>
          <DialogFooter>
            {result
              ? <Button onClick={() => downloadBlob(result.blob, result.name)}>Save ZIP file</Button>
              : <Button disabled={busy} onClick={build}>{busy ? "Preparing..." : "Prepare ZIP"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentsZipExport;
