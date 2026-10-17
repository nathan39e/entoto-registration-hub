import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEPARTMENTS, DEPARTMENT_FIELDS } from "@/data/departments";
import { validManualForm } from "../../supabase/functions/manage-users/record-rules";
import { Upload, Pencil } from "lucide-react";
import { toast } from "sonner";

type Props = { studentId: string; canEdit: boolean; onSaved: () => void | Promise<void> };

export default function StudentRecordActions({ studentId, canEdit, onSaved }: Props) {
  const [dialog, setDialog] = useState<"manual" | "choices" | null>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [choices, setChoices] = useState(["", "", ""]);
  const [fields, setFields] = useState(["", "", ""]);

  const openChoices = async () => {
    setBusy(true);
    const { data, error } = await supabase.from("applications").select("first_choice, second_choice, third_choice").eq("user_id", studentId).maybeSingle();
    setBusy(false);
    if (error || !data) return toast.error("Student has no application");
    const parts = [data.first_choice, data.second_choice, data.third_choice].map((v) => v.split(" — "));
    setChoices(parts.map((p) => p[0] ?? ""));
    setFields(parts.map((p) => p[1] ?? ""));
    setDialog("choices");
  };

  const save = async () => {
    if (dialog === "manual" && (!file || !validManualForm(file))) return toast.error("Choose a JPG, PNG, WebP or PDF under 5MB.");
    if (dialog === "choices" && (new Set(choices).size !== 3 || choices.some((d, i) => !DEPARTMENT_FIELDS[d]?.includes(fields[i])))) return toast.error("Choose three different departments and an occupation for each.");
    setBusy(true);
    try {
      let body: Record<string, unknown>;
      if (dialog === "manual" && file) {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        body = { action: "attach_manual_form", id: studentId, mime: file.type, content };
      } else body = { action: "edit_student_choices", id: studentId, choices, fields };
      const { data, error } = await supabase.functions.invoke("manage-users", { body });
      if (error || data?.error) {
        let message = data?.error || error?.message || "Could not save";
        if (error?.context instanceof Response) {
          const detail = await error.context.json().catch(() => null);
          message = detail?.error || message;
        }
        throw new Error(message);
      }
      toast.success(dialog === "manual" ? "Manual form attached to student record" : "Department choices updated");
      setDialog(null); setFile(null);
      await onSaved();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save"); }
    finally { setBusy(false); }
  };

  return <>
    <Button size="sm" variant="outline" disabled={busy} onClick={() => { setFile(null); setDialog("manual"); }}><Upload className="mr-2 h-4 w-4" />Attach Manual Form</Button>
    {canEdit && <Button size="sm" variant="outline" disabled={busy} onClick={openChoices}><Pencil className="mr-2 h-4 w-4" />Edit Department Choices</Button>}
    <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open && !busy) setDialog(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{dialog === "manual" ? "Attach Manual Form" : "Edit Department Choices"}</DialogTitle></DialogHeader>
        {dialog === "manual" ? <div className="space-y-2">
          <Label htmlFor="attach-manual-file">Filled paper form</Label>
          <Input id="attach-manual-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <p className="text-sm text-muted-foreground">Image or PDF, up to 5MB. Previously uploaded files remain stored.</p>
        </div> : <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Changing choices returns the student to their first-choice department for a new entry evaluation. Any previous placement and entry score will be reset.</p>
          {choices.map((choice, i) => <div key={i} className="grid gap-2">
            <Label>{["First", "Second", "Third"][i]} Choice</Label>
            <Select value={choice} disabled={busy} onValueChange={(v) => { setChoices((p) => p.map((d, n) => n === i ? v : d)); setFields((p) => p.map((d, n) => n === i ? "" : d)); }}>
              <SelectTrigger aria-label={`${["First", "Second", "Third"][i]} choice department`}><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={fields[i]} disabled={busy || !choice} onValueChange={(v) => setFields((p) => p.map((d, n) => n === i ? v : d))}>
              <SelectTrigger aria-label={`${["First", "Second", "Third"][i]} choice occupation`}><SelectValue placeholder="Occupation" /></SelectTrigger>
              <SelectContent>{(DEPARTMENT_FIELDS[choice] ?? []).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>)}
        </div>}
        <Button disabled={busy || (dialog === "manual" && !file)} onClick={save}>{busy ? "Saving..." : "Save"}</Button>
      </DialogContent>
    </Dialog>
  </>;
}