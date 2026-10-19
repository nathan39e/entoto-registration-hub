import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DEPARTMENTS } from "@/data/departments";
import { DEFAULT_PASSWORD, autoEmail } from "@/pages/Application";

export const PROGRAMS = ["Regular", "Extension", "Weekend"];

const RegisterStudentForm = ({ onDone }: { onDone?: () => void }) => {
  const [v, setV] = useState<Record<string, string>>({ program: "Regular", password: DEFAULT_PASSWORD });
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const set = (k: string) => (val: string) => setV((p) => ({ ...p, [k]: val, ...(k === "full_name" ? { email: autoEmail(val.trim().split(/\s+/)[0] ?? "") } : {}) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (v.choice1 && new Set([v.choice1, v.choice2, v.choice3]).size < 3) return toast.error("Choose 3 different departments.");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("manage-users", { body: { action: "register_student", ...v } });
    setBusy(false);
    if (error || data?.error) return toast.error(data?.error || error?.message || "Failed");
    setCode(data.student_code);
    toast.success("Student registered");
    setV({ program: "Regular", password: DEFAULT_PASSWORD });
    onDone?.();
  };

  const inp = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><Label htmlFor={`rs-${k}`}>{label}</Label>
      <Input id={`rs-${k}`} value={v[k] ?? ""} onChange={(e) => set(k)(e.target.value)} {...props} /></div>
  );
  const pick = (k: string, label: string, opts: string[]) => (
    <div><Label>{label}</Label>
      <Select value={v[k] ?? ""} onValueChange={set(k)}>
        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select></div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register a Student</CardTitle>
        <CardDescription>The student can log in with this email and password. They will be asked to take the exam on their dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {inp("full_name", "Full Name *", { required: true, maxLength: 100 })}
          {inp("email", "Email *", { type: "email", required: true, maxLength: 255 })}
          {inp("password", "Password (min 8) *", { type: "text", required: true, minLength: 8 })}
          {inp("phone", "Phone", { type: "tel", maxLength: 20 })}
          {inp("grade12", "Grade 12 Result", { type: "text", inputMode: "decimal", pattern: "[0-9]{1,3}([.,][0-9]{1,2})?", title: "Enter a mark like 150.32", placeholder: "e.g., 150.32" })}
          {pick("program", "Program", PROGRAMS)}
          {pick("choice1", "First Choice", DEPARTMENTS.filter((d) => d !== v.choice2 && d !== v.choice3))}
          {pick("choice2", "Second Choice", DEPARTMENTS.filter((d) => d !== v.choice1 && d !== v.choice3))}
          {pick("choice3", "Third Choice", DEPARTMENTS.filter((d) => d !== v.choice1 && d !== v.choice2))}
          <div className="md:col-span-3 flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={busy}>{busy ? "Registering..." : "Register Student"}</Button>
            {code && <span className="text-sm">New student code: <b className="text-primary">{code}</b></span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterStudentForm;
