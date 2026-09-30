import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import RegisterStudentForm from "./RegisterStudentForm";

type Profile = { id: string; full_name: string; email: string; phone: string | null; student_code: string; created_at: string; registered_by: string | null };

const StudentsTab = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Profile | null>(null);
  const [del, setDel] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => supabase.from("profiles").select("id, full_name, email, phone, student_code, created_at, registered_by")
    .order("created_at", { ascending: false }).then(({ data }) => setStudents((data as Profile[]) ?? []));
  useEffect(() => { load(); }, []);

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
    for (const s of students) {
      const a: any = byUser.get(s.id);
      const g = a?.grade_12_results ?? {};
      const pi = g.personal_info ?? {};
      const d = a?.documents ?? {};
      rows.push({
        "Student Code": s.student_code, "Full Name": s.full_name, Email: s.email, Phone: s.phone ?? pi.phone ?? "",
        Program: pi.program ?? g.program ?? "", Gender: pi.gender ?? "", "Date of Birth": pi.dob ?? "",
        Country: pi.country ?? "", Region: pi.region ?? "", City: pi.city ?? "", "Sub City": pi.subcity ?? "",
        Wereda: pi.wereda ?? "", Kebele: pi.kebele ?? "", "House No": pi.houseNumber ?? "", "Specific Place": pi.specificPlace ?? "",
        "Emergency Name": pi.emergencyName ?? "", "Emergency Relation": pi.emergencyRelation ?? "",
        "Emergency Phone": pi.emergencyPhone ?? "", "Emergency Address": pi.emergencyAddress ?? "",
        "Grade 12 Result": g.score ?? "", "Grade 12 Year": pi.grade12Year ?? "",
        "First Choice": a?.first_choice ?? "", "Second Choice": a?.second_choice ?? "", "Third Choice": a?.third_choice ?? "",
        "Application Status": a?.status ?? "Not applied", Submitted: a ? new Date(a.submitted_at).toLocaleDateString() : "",
        "Registered By": s.registered_by ? names.get(s.registered_by) ?? "Staff" : "Self",
        "Photo (7-day link)": await link(d.photo), "Grade 12 Doc": await link(d.grade12 ?? a?.result_doc_path),
        "Grade 8 Doc": await link(d.grade8), Transcript: await link(d.transcript),
        Registered: new Date(s.created_at).toLocaleDateString(),
      });
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `students-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const s = q.trim().toLowerCase();
  const filtered = students.filter((p) =>
    !s || p.full_name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s) || p.student_code.toLowerCase().includes(s));

  return (
    <div className="space-y-6">
      <RegisterStudentForm onDone={load} />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Registered Students ({students.length})</CardTitle>
            <Button onClick={exportExcel}>Download Excel</Button>
          </div>
          <CardDescription>Search by name, email or student code. The Excel file includes the application form and document links.</CardDescription>
          <Input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm mt-2" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
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
                      <Button size="sm" variant="outline" onClick={() => setEdit({ ...p })}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => sendReset(p.email)}>Reset email</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDel(p)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
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
