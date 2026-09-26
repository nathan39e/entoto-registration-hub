import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { z } from "zod";

type Exam = { id: string; title: string; form_url: string; is_active: boolean };

const schema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  form_url: z.string().trim().url("Enter a valid link").max(1000)
    .refine((u) => /^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//.test(u), "Must be a Google Forms link"),
});

const ExamFormsTab = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const load = () => supabase.from("exam_forms").select("*").order("created_at", { ascending: false })
    .then(({ data }) => setExams(data ?? []));
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse({ title, form_url: url });
    if (!p.success) return toast.error(p.error.issues[0].message);
    const { error } = await supabase.from("exam_forms").insert(p.data as { title: string; form_url: string });
    if (error) return toast.error(error.message);
    setTitle(""); setUrl(""); toast.success("Exam added"); load();
  };
  const toggle = async (x: Exam) => { await supabase.from("exam_forms").update({ is_active: !x.is_active }).eq("id", x.id); load(); };
  const remove = async (x: Exam) => { await supabase.from("exam_forms").delete().eq("id", x.id); load(); };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Psychometric Exams (Google Forms)</CardTitle>
        <CardDescription>
          Create your exam in Google Forms, click Send → link, and paste it here. Active exams are shown to students
          instead of the built-in exam. Add a "Student Code" question to your form so you can identify students.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={add} className="grid md:grid-cols-[1fr_2fr_auto] gap-3 items-end">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Psychometric Exam 2026" /></div>
          <div><Label>Google Form link</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/forms/d/e/.../viewform" /></div>
          <Button type="submit">Add exam</Button>
        </form>
        <div className="space-y-3">
          {exams.length === 0 && <p className="text-muted-foreground text-sm">No exams yet.</p>}
          {exams.map((x) => (
            <div key={x.id} className="flex flex-wrap items-center gap-3 border rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{x.title}</div>
                <a href={x.form_url} target="_blank" rel="noreferrer" className="text-xs text-primary break-all">{x.form_url}</a>
              </div>
              <div className="flex items-center gap-2 text-sm"><Switch checked={x.is_active} onCheckedChange={() => toggle(x)} />{x.is_active ? "Active" : "Hidden"}</div>
              <Button size="sm" variant="destructive" onClick={() => remove(x)}>Delete</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamFormsTab;
