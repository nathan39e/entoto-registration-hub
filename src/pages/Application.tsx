import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import ApplyWarning from "@/components/ApplyWarning";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { staffHome } from "@/lib/staffHome";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import ApplicationSummary from "@/components/ApplicationSummary";
import { DEPARTMENTS, DEPARTMENT_FIELDS } from "@/data/departments";
import { ETHIOPIA, REGIONS } from "@/data/ethiopia";
import { validManualForm } from "../../supabase/functions/manage-users/record-rules";
import EthiopianDatePicker from "@/components/EthiopianDatePicker";
import { SUBJECTS, normalizeGradeResult } from "../../supabase/functions/verify-grade/grade-results";

const text = (max = 100) => z.string().trim().min(1, "Required").max(max);
const currentYear = new Date().getFullYear();
const schema = z.object({
  firstName: text(), middleName: text(), lastName: text(),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Invalid phone number"),
  dob: text(20), gender: z.enum(["male", "female"]),
  country: text(), region: text(), city: text(),
  subcity: text(), wereda: text(), kebele: text(10), houseNumber: text(30),
  specificPlace: z.string().trim().max(300).optional(),
  emergencyName: text(), emergencyRelation: text(50),
  emergencyPhone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Invalid emergency phone number"),
  emergencyAddress: text(300),
  grade12: z.preprocess((x) => typeof x === "string" ? x.trim().replace(",", ".") : x, z.coerce.number().min(0).max(700)),
  grade12Year: z.coerce.number().int().min(1990).max(currentYear),
  program: z.enum(["Regular", "Extension", "Weekend"], { errorMap: () => ({ message: "Please select a program" }) }),
  choice1: text(), choice2: text(), choice3: text(),
  field1: text(200), field2: text(200), field3: text(200),
});

const toDataUrl = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
});
const MAX = 5 * 1024 * 1024;
const isImg = (f: File) => f.type.startsWith("image/");
const isDoc = (f: File) => isImg(f) || f.type === "application/pdf";
const EXTRA_KEYS = ["emergencySex", "motherFirstName", "motherMiddleName", "motherLastName", "emergencyRegion", "emergencySubcity", "emergencyWereda", "emergencyHouseNumber", "disability", "disabilityDetail", "highSchoolName", "grade8Result", "grade8Year", "stream", "receiptNo", ...SUBJECTS.map(([k]) => k)];
export const DEFAULT_PASSWORD = "123456789";
export const autoEmail = (first: string) => { const b = first.toLowerCase().replace(/[^a-z0-9]/g, ""); return b ? `${b}@gmail.com` : ""; };
const ageFrom = (dob?: string) => { if (!dob) return ""; const d = new Date(dob); if (isNaN(+d)) return ""; const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a >= 0 ? String(a) : ""; };

const Application = ({ staffMode = false, editMode = false }: { staffMode?: boolean; editMode?: boolean }) => {
  const { studentId } = useParams();
  const [canChangeChoices, setCanChangeChoices] = useState(false);
  const [returnPath, setReturnPath] = useState("/staff");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [doneTarget, setDoneTarget] = useState<string | null>(null);
  const initial = (): Record<string, string> => ({ country: "Ethiopia", region: "Addis Ababa", city: "Addis Ababa", ...(staffMode ? { password: DEFAULT_PASSWORD } : {}) });
  const [v, setV] = useState<Record<string, string>>(initial);
  const [resultDoc, setResultDoc] = useState<File | null>(null);
  const [docScan, setDocScan] = useState<{ file: File; extracted: number | null; isDocument: boolean } | null>(null);
  const [markReading, setMarkReading] = useState(false);
  const resultScanVersion = useRef(0);
  const [photo, setPhoto] = useState<File | null>(null);
  const [grade8, setGrade8] = useState<File | null>(null);
  const [transcripts, setTranscripts] = useState<File[]>([]);
  const [manualForm, setManualForm] = useState<File | null>(null);
  const [degree, setDegree] = useState<File | null>(null);
  const [coc, setCoc] = useState<File | null>(null);
  const [docType, setDocType] = useState<"grade12" | "degree" | "coc">("grade12");
  const set = (k: string) => (val: string) => setV((p) => {
    const n = { ...p, [k]: val };
    if (k === "region") { n.city = ""; n.subcity = ""; }
    if (k === "city") n.subcity = "";
    if (k.startsWith("choice")) n[`field${k.slice(-1)}`] = "";
    if (k === "firstName" && staffMode && !editMode) n.email = autoEmail(val);
    if (k === "kebele" && val) n.wereda = String(Number(val));
    if (k === "wereda") { const w = Number(val.trim()); if (Number.isInteger(w) && w >= 1 && w <= 15) n.kebele = String(w).padStart(2, "0"); }
    return n;
  });

  const [existing, setExisting] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [cutoffs, setCutoffs] = useState({ male: 160, female: 150 });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return navigate("/auth");
      const { data: settings } = await supabase.from("admission_settings").select("grade_12_cutoff, female_grade_12_cutoff").eq("id", true).maybeSingle();
      setCutoffs({ male: Number(settings?.grade_12_cutoff ?? 160), female: Number(settings?.female_grade_12_cutoff ?? 150) });
      if (staffMode) {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "sub_admin", "department_head"]);
        if (!r?.length) { toast.error("Access denied"); return navigate("/"); }
        setReturnPath(r.some((role) => role.role === "admin") ? "/admin-dashboard" : "/staff");
        if (editMode) {
          if (!studentId || !r.some((role) => role.role === "admin" || role.role === "sub_admin")) { toast.error("Access denied"); return navigate("/"); }
          const [{ data: app, error }, { data: profile }, { data: permission }, { data: targetRoles }] = await Promise.all([
            supabase.from("applications").select("*").eq("user_id", studentId).maybeSingle(),
            supabase.from("profiles").select("full_name,email,phone").eq("id", studentId).maybeSingle(),
            supabase.from("staff_permissions").select("can_edit_departments").eq("user_id", user.id).maybeSingle(),
            supabase.from("user_roles").select("role").eq("user_id", studentId).in("role", ["admin", "sub_admin", "department_head"]),
          ]);
          if (error || !app || !profile || targetRoles?.length) { toast.error("Student application not found"); return navigate("/staff"); }
          setCanChangeChoices(r.some((role) => role.role === "admin") || permission?.can_edit_departments === true);
          setExisting(app);
          const g = app.grade_12_results as Record<string, any>;
          const values = Object.fromEntries(Object.entries(g.personal_info ?? {}).map(([k, value]) => [k, String(value ?? "")]));
          const names = profile.full_name.split(" ");
          const preferences = [app.first_choice, app.second_choice, app.third_choice].map((c) => c.split(" — "));
          setV({ ...values, firstName: values.firstName ?? names[0] ?? "", middleName: values.middleName ?? names[1] ?? "", lastName: values.lastName ?? names.slice(2).join(" "), email: profile.email, phone: profile.phone ?? values.phone ?? "", grade12: String(g.score ?? ""), program: app.program ?? values.program ?? "", ...Object.fromEntries(preferences.flatMap((parts, i) => [[`choice${i+1}`, parts[0] ?? ""], [`field${i+1}`, parts[1] ?? ""]])) });
        }
        setChecking(false); return;
      }
      const staffPath = await staffHome(user.id);
      if (staffPath) return navigate(staffPath, { replace: true });
      const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle();
      setV((p) => ({ ...p, email: p.email ?? user.email ?? "", phone: p.phone ?? profile?.phone ?? user.user_metadata?.phone ?? "" }));
      const { data } = await supabase.from("applications").select("*").eq("user_id", user.id).maybeSingle();
      setExisting(data);
      setChecking(false);
    });
  }, [navigate, staffMode, editMode, studentId]);

  const [reading, setReading] = useState(false);
  const autofill = async (f: File | null) => {
    if (!f) return;
    if (!isImg(f) || f.size > MAX) return toast.error("Please upload a photo (JPG/PNG) of the form under 5MB.");
    setReading(true);
    try {
      const { data, error } = await supabase.functions.invoke("read-form", { body: { image: await toDataUrl(f) } });
      if (error || data?.error) throw new Error(data?.error || "Could not read the form");
      const x: Record<string, string> = data.fields ?? {};
      const matchDept = (s?: string) => s ? DEPARTMENTS.find((d) => d.toLowerCase().includes(s.toLowerCase().split(" ")[0]) || s.toLowerCase().includes(d.toLowerCase().split(" ")[0])) : undefined;
      setV((p) => {
        const n: Record<string, string> = { ...p };
        for (const [k, val] of Object.entries(x)) if (!k.startsWith("dept") && !k.startsWith("occupation") && (!editMode || k !== "email")) n[k] = val;
        if (x.gender) n.gender = x.gender.toLowerCase().startsWith("f") ? "female" : "male";
        if (x.program) n.program = ["Regular", "Extension", "Weekend"].find((o) => o.toLowerCase() === x.program.toLowerCase()) ?? "";
        if (x.emergencyFirstName && !p.emergencyName) n.emergencyName = [x.emergencyFirstName, x.emergencyMiddleName, x.emergencyLastName].filter(Boolean).join(" ");
        if (x.emergencyRegion && !p.emergencyAddress) n.emergencyAddress = [x.emergencyRegion, x.emergencySubcity, x.emergencyWereda, x.emergencyHouseNumber].filter(Boolean).join(", ");
        if (x.kebele) n.kebele = x.kebele.padStart(2, "0");
        [1, 2, 3].forEach((i) => { const d = matchDept(x[`dept${i}`]); if (d && (!editMode || canChangeChoices)) { n[`choice${i}`] = d; n[`field${i}`] = ""; } });
        return n;
      });
      setManualForm(f);
      toast.success("Form read. The photo is saved as the student's Manual Form. Check every field, then pick the occupations and upload the other documents.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read the form");
    } finally { setReading(false); }
  };

  const pickResultDoc = async (f: File | null) => {
    const version = ++resultScanVersion.current;
    setResultDoc(f);
    setDocScan(null);
    setMarkReading(false);
    if (!f || !isImg(f) || f.size > MAX) return;
    setMarkReading(true);
    try {
      const { data: scan, error } = await supabase.functions.invoke("verify-grade", { body: { image: await toDataUrl(f) } });
      if (version !== resultScanVersion.current) return;
      if (error || scan?.error) throw new Error(scan?.error || error?.message || "Could not read the document");
      setDocScan({ file: f, extracted: scan.extracted ?? null, isDocument: !!scan.isDocument });
      const result = normalizeGradeResult({ is_result_document: scan.isDocument, score: scan.extracted, subject_marks: scan.subjects });
      const subjectCount = Object.keys(result.subjects).length;
      if (result.isDocument && (result.extracted !== null || subjectCount > 0)) {
        setV((p) => ({ ...p, ...Object.fromEntries(Object.entries(result.subjects).map(([key, score]) => [key, String(score)])), ...(result.extracted !== null ? { grade12: String(result.extracted) } : {}) }));
        toast.success(`Read ${subjectCount} subject marks${result.extracted !== null ? ` and total ${result.extracted}` : ""}. Check the marks before continuing.`);
      } else if (!scan.isDocument) {
        toast.info("That file doesn't look like a Grade 12 result document — enter the mark manually.");
      } else {
        toast.info("Couldn't read the mark from the photo — enter it manually.");
      }
    } catch {
      if (version === resultScanVersion.current) toast.info("Couldn't read the marks from the photo — enter them manually.");
    } finally { if (version === resultScanVersion.current) setMarkReading(false); }
  };

  const inEthiopia = v.country?.trim().toLowerCase() === "ethiopia";
  const inAddis = inEthiopia && v.city === "Addis Ababa";
  const cities = inEthiopia && v.region ? Object.keys(ETHIOPIA[v.region] ?? {}) : [];
  const subcities = inEthiopia && v.region && v.city ? ETHIOPIA[v.region]?.[v.city] ?? [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ ...v, houseNumber: (v.houseNumber ?? "").trim() || (v.emergencyHouseNumber ?? "").trim() || "0000" });
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      return toast.error(`${i.path.join(".")}: ${i.message}`);
    }
    if (!inAddis && !parsed.data.specificPlace) return toast.error("Please enter your specific place/address.");
    const { choice1, choice2, choice3 } = parsed.data;
    if (new Set([choice1, choice2, choice3]).size < 3) return toast.error("Please choose 3 different departments.");
    if ((!editMode && !photo) || (photo && (!isImg(photo) || photo.size > MAX))) return toast.error("Please upload a personal photo (image under 5MB).");
    if ((!editMode && docType === "grade12" && !resultDoc) || (resultDoc && (!isImg(resultDoc) || resultDoc.size > MAX))) return toast.error("Grade 12 result must be an image (JPG/PNG) under 5MB.");
    if ((!editMode && !grade8) || (grade8 && (!isDoc(grade8) || grade8.size > MAX))) return toast.error("Please upload your Grade 8 result (image or PDF under 5MB).");
    if ((!editMode && !transcripts.length) || transcripts.some((f) => !isDoc(f) || f.size > MAX)) return toast.error("Please upload your Grade 9–12 transcript(s) — image or PDF, each under 5MB.");
    if (!editMode && docType === "degree" && !degree) return toast.error("Please upload your Degree document.");
    if (!editMode && docType === "coc" && !coc) return toast.error("Please upload your COC document.");
    if ([degree, coc].some((f) => f && (!isDoc(f) || f.size > MAX))) return toast.error("Degree and COC documents must be an image or PDF under 5MB.");
    if (!validManualForm(manualForm)) return toast.error("Manual form must be a JPG, PNG, WebP or PDF under 5MB.");
    if (staffMode && !editMode && (v.password ?? "").length < 8) return toast.error("Password must be at least 8 characters.");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      let ver: { match: boolean; extracted?: number | null; isDocument: boolean } = { match: true, isDocument: true };
      if (resultDoc) {
      if (docScan && docScan.file === resultDoc && docScan.isDocument && docScan.extracted != null) {
        ver = { match: Math.abs(docScan.extracted - parsed.data.grade12) < 0.01, extracted: docScan.extracted, isDocument: true };
      } else {
        toast.info("Verifying your result document...");
        const image = await toDataUrl(resultDoc);
        const { data: scanned, error: verErr } = await supabase.functions.invoke("verify-grade", {
          body: { image, enteredScore: parsed.data.grade12 },
        });
        if (verErr || scanned?.error) throw new Error(scanned?.error || "Verification failed. Try again.");
        ver = scanned;
      }
      if (!ver.isDocument) throw new Error("The uploaded file doesn't look like a Grade 12 result document.");
      if (!ver.match) throw new Error(`Entered result (${parsed.data.grade12}) does not match the document (${ver.extracted ?? "unreadable"}).`);

      }
      let ownerId = editMode && studentId ? studentId : user.id;
      if (staffMode && !editMode) {
        const d = parsed.data;
        const { data: reg, error: regErr } = await supabase.functions.invoke("manage-users", { body: {
          action: "register_student", full_name: `${d.firstName} ${d.middleName} ${d.lastName}`, email: d.email,
          password: v.password, phone: d.phone, program: d.program,
        } });
        if (regErr || reg?.error) throw new Error(reg?.error || "Could not create the student account");
        ownerId = reg.id;
        setNewCode(reg.student_code);
      }
      const upload = async (f: File, name: string) => {
        if (staffMode) {
          const content = (await toDataUrl(f)).split(",")[1];
          const { data, error } = await supabase.functions.invoke("manage-users", {
            body: { action: "upload_student_document", id: ownerId, name, mime: f.type, content, editing: editMode },
          });
          if (error || data?.error || !data?.path) throw new Error(data?.error || error?.message || "Document upload failed");
          return data.path as string;
        }
        const ext = f.name.split(".").pop() || "jpg";
        const p = `${ownerId}/${name}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("result-docs").upload(p, f, { contentType: f.type });
        if (error) throw error;
        return p;
      };
      const storedDocs = editMode ? existing?.documents ?? {} : {};
      const path = resultDoc ? await upload(resultDoc, "grade12") : storedDocs.grade12 ?? existing?.result_doc_path;
      const transcriptPaths: string[] = editMode ? [...(Array.isArray(storedDocs.transcripts) ? storedDocs.transcripts : storedDocs.transcript ? [storedDocs.transcript] : [])] : [];
      for (const f of transcripts) transcriptPaths.push(await upload(f, "transcript"));
      const documents = {
        ...storedDocs,
        ...(photo ? { photo: await upload(photo, "photo") } : {}),
        ...(path ? { grade12: path } : {}),
        ...(grade8 ? { grade8: await upload(grade8, "grade8") } : {}),
        ...(transcriptPaths.length ? { transcript: transcriptPaths[0], transcripts: transcriptPaths } : {}),
        ...(degree ? { degree: await upload(degree, "degree") } : {}),
        ...(coc ? { coc: await upload(coc, "coc") } : {}),
        ...(manualForm ? { manualForm: await upload(manualForm, "manualForm") } : {}),
      };

      const { choice1: c1, choice2: c2, choice3: c3, field1, field2, field3, grade12, ...personal } = parsed.data;
      const form_details = Object.fromEntries(EXTRA_KEYS.filter((k) => editMode || (v[k] ?? "").trim()).map((k) => [k, (v[k] ?? "").trim().slice(0, 300)]));
      const appRow = {
        grade_12_results: { score: grade12, verified: true, verified_score: ver.extracted, personal_info: { ...personal, ...form_details }, sub_fields: [field1, field2, field3], ...(staffMode ? { registered_by_staff: true } : {}) },
        first_choice: `${c1} — ${field1}`, second_choice: `${c2} — ${field2}`, third_choice: `${c3} — ${field3}`,
        result_doc_path: path,
        documents,
      };
      if (editMode) {
        const { data, error } = await supabase.functions.invoke("manage-users", { body: { action: "update_student_application", id: ownerId, personal: { ...personal, ...form_details }, score: grade12, choices: [c1, c2, c3], fields: [field1, field2, field3], documents } });
        if (error || data?.error) {
          const detail = error?.context instanceof Response ? await error.context.json().catch(() => null) : null;
          throw new Error(data?.error || detail?.error || error?.message || "Could not save student form");
        }
        toast.success("Student's full application updated");
        navigate(returnPath);
        return;
      }
      if (staffMode) {
        const { data: sa, error: saErr } = await supabase.functions.invoke("manage-users", { body: { action: "staff_application", id: ownerId, application: appRow } });
        if (saErr || sa?.error) throw new Error(sa?.error || "Could not save the application");
        const cutoff = v.gender === "female" ? cutoffs.female : cutoffs.male;
        toast.success(grade12 >= cutoff
          ? "Student registered and can continue to the exam. Documents are awaiting admin review."
          : `Student registered on the waiting list because the result is below ${cutoff}.`);
        setV(initial());
        (e.target as HTMLFormElement).reset();
        setPhoto(null); setResultDoc(null); setGrade8(null); setTranscripts([]); setManualForm(null);
        setDegree(null); setCoc(null); setDocType("grade12");
        return;
      }
      const { data: saved, error } = await supabase.from("applications").insert({ user_id: user.id, ...appRow }).select("status").single();
      if (error) {
        if (error.code === "23505") throw new Error("You have already submitted an application.");
        throw error;
      }
      if (saved?.status !== "waiting_list") {
        toast.success("Application submitted! Your documents are awaiting admin review.");
        setDoneTarget("/psychometric-exam");
      } else {
        toast.info("Application submitted to the waiting list because the result is below the current minimum.");
        setDoneTarget("/student-dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const field = (id: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <Label htmlFor={id}>{label} *</Label>
      <Input id={id} value={v[id] ?? ""} onChange={(e) => set(id)(e.target.value)} required {...props} />
    </div>
  );
  const pick = (id: string, label: string, options: string[], placeholder: string) => (
    <div>
      <Label>{label} *</Label>
      <Select disabled={editMode && !canChangeChoices && (id.startsWith("choice") || id.startsWith("field"))} value={v[id] ?? ""} onValueChange={set(id)}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
  const deptSelect = (n: number, label: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4">
      {pick(`choice${n}`, `${label} — Department`, DEPARTMENTS.filter((d) => ![1, 2, 3].some((o) => o !== n && v[`choice${o}`] === d)), "Select department")}
      {v[`choice${n}`] ? pick(`field${n}`, "Occupation", DEPARTMENT_FIELDS[v[`choice${n}`]] ?? [], "Select occupation")
        : <div className="text-sm text-muted-foreground self-end pb-2">Choose a department first</div>}
    </div>
  );
  const opt = (id: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={v[id] ?? ""} maxLength={300} onChange={(e) => set(id)(e.target.value)} {...props} />
    </div>
  );
  const optPick = (id: string, label: string, options: string[]) => (
    <div>
      <Label>{label}</Label>
      <Select disabled={editMode && !canChangeChoices && (id.startsWith("choice") || id.startsWith("field"))} value={v[id] ?? ""} onValueChange={set(id)}>
        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o} className="capitalize">{o[0].toUpperCase() + o.slice(1)}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
  const cameraButton = (id: string, onPick: (f: File) => void, disabled?: boolean) => (
    <>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => document.getElementById(`${id}-camera`)?.click()}>
        <Camera className="mr-1 h-4 w-4" /> Take a photo
      </Button>
      <input id={`${id}-camera`} type="file" accept="image/*" capture="environment" className="hidden" aria-hidden="true" tabIndex={-1}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
    </>
  );
  const fileInput = (id: string, label: string, accept: string, onPick: (f: File | null) => void, hint: string, selected?: string) => (
    <div>
      <Label htmlFor={id}>{label}{editMode ? " (optional replacement)" : (id === "manualForm" || (["degree", "coc"].includes(id) && id !== docType)) ? " (optional)" : " *"}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input id={id} type="file" accept={accept} className="flex-1 min-w-44"
          onChange={(e) => onPick(e.target.files?.[0] ?? (id === "manualForm" ? manualForm : null))} />
        {cameraButton(id, (f) => onPick(f))}
      </div>
      {editMode && (() => {
        const key = id === "resultDoc" ? "grade12" : id;
        const path = existing?.documents?.[key] ?? (key === "grade12" ? existing?.result_doc_path : null);
        return path ? <Button type="button" variant="link" size="sm" onClick={async () => {
          const { data, error } = await supabase.storage.from("result-docs").createSignedUrl(path, 600);
          if (error) toast.error(error.message); else if (data) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
        }}>View current document</Button> : null;
      })()}
      {selected && <p className="text-xs text-primary mt-1 truncate">Selected: {selected}</p>}
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  );

  if (checking) return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-grow flex items-center justify-center text-muted-foreground">Loading...</main><Footer /></div>
  );
  if (existing && !editMode) return <ApplicationSummary app={existing} />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
         <section className="py-10 md:py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">{editMode ? "Edit Student Application" : staffMode ? "Register a Student" : "Apply Now"}</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              {editMode ? "" : staffMode ? "Complete the student's full application below." : "Take the first step towards your future. Complete the application form below."}
            </p>
          </div>
        </section>

        <section className="py-12 md:py-20 bg-background">
          <div className="container mx-auto px-4 min-w-0">
            {!staffMode && !editMode && <div className="max-w-4xl mx-auto mb-6"><ApplyWarning large /></div>}
            <Card className="max-w-4xl mx-auto min-w-0">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl">Student Registration Form</CardTitle>
                <CardDescription>Fields marked with * are mandatory.{staffMode && !editMode && ` The current Grade 12 minimum is ${cutoffs.male} for male and ${cutoffs.female} for female. You are registering a student — they log in with the email and password below.`}</CardDescription>
                {staffMode && newCode && <p className="text-sm mt-2">Last registered student code: <b className="text-primary">{newCode}</b></p>}
              </CardHeader>
              <CardContent>
                {staffMode && (
                  <div className="mb-8 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
                    <Label htmlFor="formPhoto" className="font-semibold">Fill from a photo of the paper form</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input id="formPhoto" type="file" accept="image/*" disabled={reading} className="mt-2 flex-1 min-w-44"
                        onChange={(e) => { autofill(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                      {cameraButton("formPhoto", autofill, reading)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{reading ? "Reading the form..." : "Upload a clear photo of the filled application form. Fields are filled automatically — check them before submitting."}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {field("firstName", "First Name", { maxLength: 100 })}
                      {field("middleName", "Middle Name", { maxLength: 100 })}
                      {field("lastName", "Last Name", { maxLength: 100 })}
                      {field("email", "Email Address", { type: "email", maxLength: 255 })}
                      {staffMode && !editMode && field("password", "Student Password (min 8)", { type: "text", minLength: 8, autoComplete: "new-password" })}
                      {field("phone", "Phone Number", { type: "tel", placeholder: "+2519..." })}
                      <EthiopianDatePicker value={v.dob ?? ""} onChange={set("dob")} />
                      <div><Label>Age</Label><Input value={ageFrom(v.dob)} readOnly placeholder="From date of birth" /></div>
                      <div>
                        <Label>Gender *</Label>
                        <Select value={v.gender} onValueChange={set("gender")}>
                          <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {fileInput("photo", "Personal Photo", "image/*", setPhoto, "Clear passport-style photo, under 5MB.", photo?.name)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {field("country", "Country", { maxLength: 100 })}
                      {inEthiopia ? pick("region", "Region / City Administration", REGIONS, "Select region") : field("region", "Region / State", { maxLength: 100 })}
                      {inEthiopia && cities.length ? pick("city", "City", cities, "Select city") : field("city", "City", { maxLength: 100 })}
                      {subcities.length ? pick("subcity", "Sub City", subcities, "Select sub city")
                        : field("subcity", "Sub City / Zone", { maxLength: 100 })}
                      {field("wereda", "Wereda", { maxLength: 100 })}
                      <div>
                        <Label>Kebele *</Label>
                        <Select value={v.kebele} onValueChange={set("kebele")}>
                          <SelectTrigger><SelectValue placeholder="Select kebele" /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(2, "0")).map((k) => (
                              <SelectItem key={k} value={k}>{k}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {opt("houseNumber", "House Number", { maxLength: 30, placeholder: "Empty = emergency contact's or 0000" })}
                    </div>
                    {!inAddis && (
                      <div className="mt-4">
                        {field("specificPlace", "Specific Place (you live outside Addis Ababa)", {
                          maxLength: 300, placeholder: "e.g., Region, town, nearby landmark",
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <h3 className="text-xl font-semibold mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {field("emergencyName", "Full Name", { maxLength: 100 })}
                      {field("emergencyRelation", "Relationship", { maxLength: 50, placeholder: "e.g., Mother" })}
                      {field("emergencyPhone", "Phone Number", { type: "tel", placeholder: "+2519..." })}
                    </div>
                    <div className="mt-4">
                      {field("emergencyAddress", "Address", { maxLength: 300, placeholder: "City, sub city, wereda, house number" })}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      {optPick("emergencySex", "Contact's Sex", ["male", "female"])}
                      {opt("emergencyRegion", "Region")}
                      {opt("emergencySubcity", "Sub City")}
                      {opt("emergencyWereda", "Woreda")}
                      {opt("emergencyHouseNumber", "House No")}
                      {opt("motherFirstName", "Mother's Name")}
                      {opt("motherMiddleName", "Mother's Middle Name")}
                      {opt("motherLastName", "Mother's Last Name")}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {optPick("disability", "Physical Disability", ["yes", "no"])}
                      {v.disability === "yes" && <div className="md:col-span-2">{opt("disabilityDetail", "Describe the problem")}</div>}
                      {opt("highSchoolName", "High School Name")}
                      {opt("grade8Result", "Grade 8 Result")}
                      {opt("grade8Year", "Grade 8 Completion Year", { inputMode: "numeric" })}
                      {optPick("stream", "Secondary School Stream", ["natural", "social"])}
                    </div>
                    <p className="text-sm font-medium mb-2">Grade 12 Subject Marks</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {SUBJECTS.map(([k, l]) => <div key={k}>{opt(k, l, { inputMode: "decimal" })}</div>)}
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {field("grade12", "Grade 12 Exit Exam Result", { type: "text", inputMode: "decimal", pattern: "[0-9]{1,3}([.,][0-9]{1,2})?", title: "Enter a mark like 150.32", placeholder: "e.g., 150.32" })}
                      {field("grade12Year", "Year Grade 12 Completed", { type: "number", min: 1990, max: currentYear, placeholder: `e.g., ${currentYear - 1}` })}
                      <div>
                        <Label>Document to upload *</Label>
                        <Select value={docType} onValueChange={(x) => setDocType(x as "grade12" | "degree" | "coc")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grade12">Grade 12 Result</SelectItem>
                            <SelectItem value="degree">Degree</SelectItem>
                            <SelectItem value="coc">COC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {docType === "grade12" && fileInput("resultDoc", "Grade 12 Result Document (image)", "image/*", pickResultDoc, markReading ? "Reading total and subject marks..." : "Image under 5MB.", resultDoc?.name)}
                      {docType === "degree" && fileInput("degree", "Degree Document", "image/*,application/pdf", setDegree, "Image or PDF, under 5MB.", degree?.name)}
                      {docType === "coc" && fileInput("coc", "COC Document", "image/*,application/pdf", setCoc, "Image or PDF, under 5MB.", coc?.name)}
                      {fileInput("grade8", "Grade 8 Result", "image/*,application/pdf", setGrade8, "Image or PDF, under 5MB.", grade8?.name)}
                      <div>
                        <Label htmlFor="transcript">Transcript (Grade 9–12){editMode ? " (add documents)" : " *"}</Label>
                        {editMode && <p className="text-xs text-muted-foreground">Existing transcripts remain attached. New files are added to them.</p>}
                        <div className="flex flex-wrap items-center gap-2">
                          <Input id="transcript" type="file" accept="image/*,application/pdf" multiple
                            onChange={(e) => setTranscripts(Array.from(e.target.files ?? []))} className="flex-1 min-w-44" />
                          {cameraButton("transcript", (f) => setTranscripts((p) => [...p, f]))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {transcripts.length
                            ? `${transcripts.length} file${transcripts.length > 1 ? "s" : ""} selected: ${transcripts.map((f) => f.name).join(", ")}`
                            : "You can select more than one file — images or PDFs, each under 5MB."}
                        </p>
                      </div>
                      {fileInput("manualForm", "Filled Manual Form", "image/*,application/pdf", setManualForm, "Scan or photo of the completed paper form — image or PDF, under 5MB.", manualForm?.name)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Department Preferences</h3>
                    {editMode && !canChangeChoices && <p className="text-sm text-muted-foreground mb-4">Department choices require permission from your admin.</p>}
                    <div className="space-y-4">
                      <div className="max-w-sm">{pick("program", "Program", ["Regular", "Extension", "Weekend"], "Select program")}</div>
                      {deptSelect(1, "First Choice")}
                      {deptSelect(2, "Second Choice")}
                      {deptSelect(3, "Third Choice")}
                    </div>
                  </div>

                  <div className="max-w-sm">{opt("receiptNo", "Receipt No")}</div>
                  {editMode && <Button type="button" variant="outline" onClick={() => navigate(returnPath)} disabled={loading}>Cancel</Button>}
                  <Button type="submit" size="lg" className="w-full" disabled={loading || markReading}>
                    {loading ? (editMode ? "Saving..." : "Verifying & submitting...") : editMode ? "Save Changes" : "Submit Application"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Dialog open={!!doneTarget} onOpenChange={(o) => { if (!o && doneTarget) navigate(doneTarget); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="text-2xl">Application Submitted — Important!</DialogTitle></DialogHeader>
          <ApplyWarning large />
          <Button size="lg" className="w-full" onClick={() => doneTarget && navigate(doneTarget)}>እሺ / OK, I understand</Button>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default Application;
