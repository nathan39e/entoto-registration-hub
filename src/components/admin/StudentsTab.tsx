import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import DocumentsZipExport from "./DocumentsZipExport";
import StudentRecordActions from "@/components/StudentRecordActions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEPARTMENTS, DEPARTMENT_FIELDS } from "@/data/departments";
import FilterCounts from "@/components/FilterCounts";
import { occupationOf } from "@/lib/studentExport";
import { matchesStudentExport } from "@/lib/studentExport";
import { formatEthiopianDate } from "@/lib/ethiopianCalendar";
import type { Database } from "@/integrations/supabase/types";

type Profile = { id: string; full_name: string; email: string; phone: string | null; student_code: string; created_at: string; registered_by: string | null };

const StudentsTab = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Profile | null>(null);
  const [del, setDel] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [department, setDepartment] = useState("All");
  const [program, setProgram] = useState("All");
  const [status, setStatus] = useState("All");
  const [occupation, setOccupation] = useState("All");
  const [applications, setApplications] = useState<Database["public"]["Tables"]["applications"]["Row"][]>([]);
  const [docs, setDocs] = useState<{ name: string; links: [string, string][] } | null>(null);
  const navigate = useNavigate();

  const inRange = (d: string) => {
    const day = d.slice(0, 10);
    return (!from || day >= from) && (!to || day <= to);
  };

  const showDocs = async (p: Profile) => {
    const { data: a } = await supabase.from("applications").select("documents, result_doc_path").eq("user_id", p.id).maybeSingle();
    const d: Record<string, string> = { ...((a?.documents as Record<string, string>) ?? {}) };
    if (!d.grade12 && a?.result_doc_path) d.grade12 = a.result_doc_path;
    const labels: [string, string][] = [["photo", "Photo"], ["grade12", "Grade 12 Result"], ["grade8", "Grade 8 Result"], ["transcript", "Transcript (9–12)"], ["manualForm", "Manual Form"]];
    const links: [string, string][] = [];
    for (const [k, l] of labels) {
      if (!d[k]) { links.push([l, ""]); continue; }
      const { data } = await supabase.storage.from("result-docs").createSignedUrl(d[k], 600);
      links.push([l, data?.signedUrl ?? ""]);
    }
    const extra = (Array.isArray(d.transcripts) ? (d.transcripts as string[]) : []).slice(d.transcript ? 1 : 0);
    for (const [i, p] of extra.entries()) {
      const { data } = await supabase.storage.from("result-docs").createSignedUrl(p, 600);
      links.push([`Transcript ${i + 2}`, data?.signedUrl ?? ""]);
    }
    setDocs({ name: p.full_name, links });
  };

  const load = async () => {
    const [{ data }, { data: roles }, apps] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, student_code, created_at, registered_by").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").in("role", ["admin", "sub_admin", "department_head"]),
      supabase.from("applications").select("*"),
    ]);
    if (apps.error) return toast.error("Could not load application filters");
    setApplications(apps.data ?? []);
    const admins = new Set((roles ?? []).map((r) => r.user_id));
    setStudents(((data as Profile[]) ?? []).filter((p) => !admins.has(p.id)));
  };
  useEffect(() => { load(); }, []);
  const [pickOpen, setPickOpen] = useState(false);

  const call = async (body: Record<string, unknown>) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("manage-users", { body });
    setBusy(false);
    if (error || data?.error) { toast.error(data?.error || error?.message); return false; }
    return true;
  };

  const sendReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message); else toast.success(`Password reset email sent to ${email}`);
  };

  const exportExcel = async () => {
    if (from && to && from > to) return toast.error("End date must be on or after start date");
    toast.info("Preparing Excel file...");
    const { data: apps } = await supabase.from("applications").select("*");
    const byUser = new Map((apps ?? []).map((a: any) => [a.user_id, a]));
    const names = new Map(students.map((s) => [s.id, s.full_name]));
    const link = async (p?: string) => {
      if (!p) return "";
      const { data } = await supabase.storage.from("result-docs").createSignedUrl(p, 60 * 60 * 24 * 7);
      return data?.signedUrl ?? "";
    };
    const rows = [];
    const list = students.filter((s) => matchesStudentExport(s, byUser.get(s.id), { from, to, department, program, status, search: q, occupation }));
    if (!list.length) return toast.error("No students registered in that date range.");
    for (const s of list) {
      const a: any = byUser.get(s.id);
      const g = a?.grade_12_results ?? {};
      const pi = g.personal_info ?? {};
      const d = a?.documents ?? {};
      rows.push({
        "Student Code": s.student_code, "Full Name": s.full_name, Email: s.email, Phone: s.phone ?? pi.phone ?? "",
        Program: a?.program ?? pi.program ?? g.program ?? "", Gender: pi.gender ?? "", "Date of Birth (E.C.)": formatEthiopianDate(pi.dob ?? ""),
        Country: pi.country ?? "", Region: pi.region ?? "", City: pi.city ?? "", "Sub City": pi.subcity ?? "",
        Wereda: pi.wereda ?? "", Kebele: pi.kebele ?? "", "House No": pi.houseNumber ?? "", "Specific Place": pi.specificPlace ?? "",
        "Emergency Name": pi.emergencyName ?? "", "Emergency Relation": pi.emergencyRelation ?? "",
        "Emergency Phone": pi.emergencyPhone ?? "", "Emergency Address": pi.emergencyAddress ?? "",
        "Grade 12 Result": g.score ?? "", "Grade 12 Year": pi.grade12Year ?? "",
        "First Choice": a?.first_choice ?? "", "Second Choice": a?.second_choice ?? "", "Third Choice": a?.third_choice ?? "",
        "Application Status": a?.status ?? "Not applied", Submitted: a ? new Date(a.submitted_at).toLocaleDateString() : "",
        "Registered By": s.registered_by ? names.get(s.registered_by) ?? "Staff" : "Self",
        "Photo (7-day link)": await link(d.photo), "Grade 12 Doc": await link(d.grade12 ?? a?.result_doc_path),
        "Grade 8 Doc": await link(d.grade8), Transcript: await link(d.transcript), "Manual Form": await link(d.manualForm),
        "Additional Transcripts": (Array.isArray(d.transcripts) ? await Promise.all((d.transcripts as string[]).slice(d.transcript ? 1 : 0).map(link)) : []).join("\n"),
        Registered: new Date(s.created_at).toLocaleDateString(),
      });
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `students-${from || "start"}-to-${to || new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filtered = students.filter((p) => {
    const a = applications.find((x) => x.user_id === p.id);
    const docs = (a?.documents ?? {}) as Record<string, unknown>;
    const hasDocs = !!a?.result_doc_path || Object.values(docs).some((v) => !!v && (!Array.isArray(v) || v.length > 0));
    if (!a && !hasDocs) return false;
    return matchesStudentExport(p, a, { from, to, department, program, status, search: q, occupation });
  });
  const filterControls = <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div><Label>Department</Label><Select value={department} onValueChange={(v) => { setDepartment(v); setOccupation("All"); }}><SelectTrigger aria-label="Export department"><SelectValue /></SelectTrigger><SelectContent>{["All", ...DEPARTMENTS].map((d) => <SelectItem key={d} value={d}>{d === "All" ? "All departments" : d}</SelectItem>)}</SelectContent></Select></div>
    <div><Label>Program</Label><Select value={program} onValueChange={setProgram}><SelectTrigger aria-label="Export program"><SelectValue /></SelectTrigger><SelectContent>{["All", "Regular", "Extension", "Weekend"].map((p) => <SelectItem key={p} value={p}>{p === "All" ? "All programs" : p}</SelectItem>)}</SelectContent></Select></div>
    <div><Label>Occupation</Label><Select value={occupation} onValueChange={setOccupation}><SelectTrigger aria-label="Export occupation"><SelectValue /></SelectTrigger><SelectContent>{["All", ...(department === "All" ? Object.values(DEPARTMENT_FIELDS).flat() : DEPARTMENT_FIELDS[department] ?? [])].map((o) => <SelectItem key={o} value={o}>{o === "All" ? "All occupations" : o}</SelectItem>)}</SelectContent></Select></div>
    <div><Label>Application status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Export application status"><SelectValue /></SelectTrigger><SelectContent>{[["All", "All statuses"], ["approved", "Approved"], ["waiting_list", "Waiting list"], ["pending", "Document review"], ["rejected", "Rejected"], ["not_applied", "Not applied"]].map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
  </div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Registered Students ({students.length})</CardTitle>
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => navigate("/staff/apply")}>Register Student</Button><DocumentsZipExport /><Button onClick={() => setPickOpen(true)}>Download Excel</Button></div>
          </div>
          <CardDescription>Search by name, email or student code. The Excel file includes the application form and document links.</CardDescription>
          <div className="flex flex-wrap items-end gap-3 mt-2">
            <Input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
            <div><Label htmlFor="from">Registered from</Label><Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label htmlFor="to">to</Label><Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            {(from || to) && <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>Clear dates</Button>}
          </div>
          <p className="text-xs text-muted-foreground">The list and the Excel download only include students registered in the chosen dates.</p>
          {filterControls}
          <FilterCounts items={filtered.map((p) => { const a = applications.find((x) => x.user_id === p.id); return { program: a?.program, occupation: occupationOf(a?.first_choice) }; })} />
        </CardHeader>
        <CardContent>
          <div className="sm:hidden max-h-[600px] overflow-y-auto space-y-3">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">No students match.</p>}
            {filtered.map((p) => (
              <div key={p.id} className="rounded-md border p-3 space-y-1 text-sm">
                <p className="font-semibold break-words">{p.full_name}</p>
                <p className="text-muted-foreground break-all">{p.email}</p>
                <p>{p.student_code} · {p.phone || "—"}</p>
                <p className="text-xs text-muted-foreground">Registered {new Date(p.created_at).toLocaleDateString()}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => showDocs(p)}>Documents</Button>
                  <StudentRecordActions studentId={p.id} canEdit={true} onSaved={() => showDocs(p)} />
                  <Button size="sm" variant="outline" onClick={() => setEdit({ ...p })}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => sendReset(p.email)}>Reset email</Button>
                  <Button size="sm" variant="destructive" onClick={() => setDel(p)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden sm:block max-h-[500px] w-full max-w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Student Code</TableHead>
                  <TableHead>Phone</TableHead><TableHead>Registered</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.student_code}</TableCell>
                    <TableCell>{p.phone || "—"}</TableCell>
                    <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => showDocs(p)}>Documents</Button>
                      <StudentRecordActions studentId={p.id} canEdit={true} onSaved={() => showDocs(p)} />
                      <Button size="sm" variant="outline" onClick={() => setEdit({ ...p })}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => sendReset(p.email)}>Reset email</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDel(p)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div><Label>Full Name</Label><Input value={edit.full_name} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={edit.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button disabled={busy} onClick={async () => {
              if (edit && await call({ action: "update_student", id: edit.id, full_name: edit.full_name, email: edit.email, phone: edit.phone })) {
                toast.success("Student updated"); setEdit(null); load();
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pickOpen} onOpenChange={setPickOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Download Excel</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Choose which registration days to include. Leave a date empty to include everything before or after.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="dl-from">From day</Label><Input id="dl-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label htmlFor="dl-to">To day</Label><Input id="dl-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </div>
          <Input aria-label="Export student search" placeholder="Search name, phone, email or student code" value={q} onChange={(e) => setQ(e.target.value)} />
          {filterControls}
          <p className="text-sm">{filtered.length} students will be included.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>All days</Button>
            <Button disabled={!filtered.length || !!(from && to && from > to)} onClick={async () => { setPickOpen(false); await exportExcel(); }}>Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!docs} onOpenChange={(o) => !o && setDocs(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Documents — {docs?.name}</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            {docs?.links.map(([l, u]) => (
              <Button key={l} variant="outline" disabled={!u} onClick={() => window.open(u, "_blank")}>{l}{!u && " (not uploaded)"}</Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {del?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the account, application, payments and exam results. It cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={async () => {
              if (del && await call({ action: "delete_student", id: del.id })) { toast.success("Student deleted"); setDel(null); load(); }
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentsTab;
