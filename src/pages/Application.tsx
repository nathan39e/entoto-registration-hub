import { useEffect, useState } from "react";
import { staffHome } from "@/lib/staffHome";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import ApplicationSummary from "@/components/ApplicationSummary";
import { DEPARTMENTS, DEPARTMENT_FIELDS } from "@/data/departments";
import { ETHIOPIA, REGIONS } from "@/data/ethiopia";

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
const SUBJECTS: [string, string][] = [["english", "English"], ["physics", "Physics"], ["civics", "Civics"], ["geography", "Geography"], ["naturalMath", "Natural Math"], ["biology", "Biology"], ["socialMath", "Social Math"], ["economics", "Economics"], ["aptitude", "Aptitude"], ["chemistry", "Chemistry"], ["history", "History"]];
const EXTRA_KEYS = ["emergencySex", "motherFirstName", "motherMiddleName", "motherLastName", "emergencyRegion", "emergencySubcity", "emergencyWereda", "emergencyHouseNumber", "disability", "disabilityDetail", "highSchoolName", "grade8Result", "grade8Year", "stream", "receiptNo", ...SUBJECTS.map(([k]) => k)];
const ageFrom = (dob?: string) => { if (!dob) return ""; const d = new Date(dob); if (isNaN(+d)) return ""; const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a >= 0 ? String(a) : ""; };

const Application = ({ staffMode = false }: { staffMode?: boolean }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [v, setV] = useState<Record<string, string>>({ country: "Ethiopia", region: "Addis Ababa", city: "Addis Ababa" });
  const [resultDoc, setResultDoc] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [grade8, setGrade8] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<File | null>(null);
  const [manualForm, setManualForm] = useState<File | null>(null);
  const set = (k: string) => (val: string) => setV((p) => {
    const n = { ...p, [k]: val };
    if (k === "region") { n.city = ""; n.subcity = ""; }
    if (k === "city") n.subcity = "";
    if (k.startsWith("choice")) n[`field${k.slice(-1)}`] = "";
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
        setChecking(false); return;
      }
      const staffPath = await staffHome(user.id);
      if (staffPath) return navigate(staffPath, { replace: true });
      setV((p) => ({ ...p, email: p.email ?? user.email ?? "" }));
      const { data } = await supabase.from("applications").select("*").eq("user_id", user.id).maybeSingle();
      setExisting(data);
      setChecking(false);
    });
  }, [navigate, staffMode]);

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
        for (const [k, val] of Object.entries(x)) if (!k.startsWith("dept") && !k.startsWith("occupation")) n[k] = val;
        if (x.gender) n.gender = x.gender.toLowerCase().startsWith("f") ? "female" : "male";
        if (x.program) n.program = ["Regular", "Extension", "Weekend"].find((o) => o.toLowerCase() === x.program.toLowerCase()) ?? "";
        if (x.emergencyFirstName && !p.emergencyName) n.emergencyName = [x.emergencyFirstName, x.emergencyMiddleName, x.emergencyLastName].filter(Boolean).join(" ");
        if (x.emergencyRegion && !p.emergencyAddress) n.emergencyAddress = [x.emergencyRegion, x.emergencySubcity, x.emergencyWereda, x.emergencyHouseNumber].filter(Boolean).join(", ");
        if (x.kebele) n.kebele = x.kebele.padStart(2, "0");
        [1, 2, 3].forEach((i) => { const d = matchDept(x[`dept${i}`]); if (d) { n[`choice${i}`] = d; n[`field${i}`] = ""; } });
        return n;
      });
      setManualForm(f);
      toast.success("Form read. The photo is saved as the student's Manual Form. Check every field, then pick the sub fields and upload the other documents.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read the form");
    } finally { setReading(false); }
  };

  const inEthiopia = v.country?.trim().toLowerCase() === "ethiopia";
  const inAddis = inEthiopia && v.city === "Addis Ababa";
  const cities = inEthiopia && v.region ? Object.keys(ETHIOPIA[v.region] ?? {}) : [];
  const subcities = inEthiopia && v.region && v.city ? ETHIOPIA[v.region]?.[v.city] ?? [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      return toast.error(`${i.path.join(".")}: ${i.message}`);
    }
    if (!inAddis && !parsed.data.specificPlace) return toast.error("Please enter your specific place/address.");
    const { choice1, choice2, choice3 } = parsed.data;
    if (new Set([choice1, choice2, choice3]).size < 3) return toast.error("Please choose 3 different departments.");
    if (!photo || !isImg(photo) || photo.size > MAX) return toast.error("Please upload a personal photo (image under 5MB).");
    if (!resultDoc || !isImg(resultDoc) || resultDoc.size > MAX) return toast.error("Grade 12 result must be an image (JPG/PNG) under 5MB.");
    if (!grade8 || !isDoc(grade8) || grade8.size > MAX) return toast.error("Please upload your Grade 8 result (image or PDF under 5MB).");
    if (!transcript || !isDoc(transcript) || transcript.size > MAX) return toast.error("Please upload your Grade 9–12 transcript (image or PDF under 5MB).");
    if (!manualForm || !isDoc(manualForm) || manualForm.size > MAX) return toast.error("Please upload the filled manual form (image or PDF under 5MB).");
    if (staffMode && (v.password ?? "").length < 8) return toast.error("Password must be at least 8 characters.");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      toast.info("Verifying your result document...");
      const image = await toDataUrl(resultDoc);
      const { data: ver, error: verErr } = await supabase.functions.invoke("verify-grade", {
        body: { image, enteredScore: parsed.data.grade12 },
      });
      if (verErr || ver?.error) throw new Error(ver?.error || "Verification failed. Try again.");
      if (!ver.isDocument) throw new Error("The uploaded file doesn't look like a Grade 12 result document.");
      if (!ver.match) throw new Error(`Entered result (${parsed.data.grade12}) does not match the document (${ver.extracted ?? "unreadable"}).`);

      let ownerId = user.id;
      if (staffMode) {
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
            body: { action: "upload_student_document", id: ownerId, name, mime: f.type, content },
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
      const path = await upload(resultDoc, "grade12");
      const documents = {
        photo: await upload(photo, "photo"),
        grade12: path,
        grade8: await upload(grade8, "grade8"),
        transcript: await upload(transcript, "transcript"),
        manualForm: await upload(manualForm, "manualForm"),
      };

      const { choice1: c1, choice2: c2, choice3: c3, field1, field2, field3, grade12, ...personal } = parsed.data;
      const form_details = Object.fromEntries(EXTRA_KEYS.filter((k) => (v[k] ?? "").trim()).map((k) => [k, v[k].trim().slice(0, 300)]));
      const appRow = {
        grade_12_results: { score: grade12, verified: true, verified_score: ver.extracted, personal_info: { ...personal, ...form_details }, sub_fields: [field1, field2, field3], ...(staffMode ? { registered_by_staff: true } : {}) },
        first_choice: `${c1} — ${field1}`, second_choice: `${c2} — ${field2}`, third_choice: `${c3} — ${field3}`,
        result_doc_path: path,
        documents,
      };
      if (staffMode) {
        const { data: sa, error: saErr } = await supabase.functions.invoke("manage-users", { body: { action: "staff_application", id: ownerId, application: appRow } });
        if (saErr || sa?.error) throw new Error(sa?.error || "Could not save the application");
        const cutoff = v.gender === "female" ? cutoffs.female : cutoffs.male;
        toast.success(grade12 >= cutoff
          ? "Student registered and can continue to the exam. Documents are awaiting admin review."
          : `Student registered on the waiting list because the result is below ${cutoff}.`);
        setV({ country: "Ethiopia", region: "Addis Ababa", city: "Addis Ababa" });
        (e.target as HTMLFormElement).reset();
        setPhoto(null); setResultDoc(null); setGrade8(null); setTranscript(null); setManualForm(null);
        return;
      }
      const { data: saved, error } = await supabase.from("applications").insert({ user_id: user.id, ...appRow }).select("status").single();
      if (error) {
        if (error.code === "23505") throw new Error("You have already submitted an application.");
        throw error;
      }
      if (saved?.status !== "waiting_list") {
        toast.success("Application submitted! Your documents are awaiting admin review. Proceeding to the exam.");
        setTimeout(() => navigate("/psychometric-exam"), 1200);
      } else {
        toast.info("Application submitted to the waiting list because the result is below the current minimum.");
        setTimeout(() => navigate("/student-dashboard"), 1200);
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
      <Select value={v[id] ?? ""} onValueChange={set(id)}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
  const deptSelect = (n: number, label: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4">
      {pick(`choice${n}`, `${label} — Department`, DEPARTMENTS, "Select department")}
      {v[`choice${n}`] ? pick(`field${n}`, "Sub Field", DEPARTMENT_FIELDS[v[`choice${n}`]] ?? [], "Select sub field")
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
      <Select value={v[id] ?? ""} onValueChange={set(id)}>
        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o} className="capitalize">{o[0].toUpperCase() + o.slice(1)}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
  const fileInput = (id: string, label: string, accept: string, onPick: (f: File | null) => void, hint: string) => (
    <div>
      <Label htmlFor={id}>{label} *</Label>
      <Input id={id} type="file" accept={accept} required onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  );

  if (checking) return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-grow flex items-center justify-center text-muted-foreground">Loading...</main><Footer /></div>
  );
  if (existing) return <ApplicationSummary app={existing} />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
         <section className="py-10 md:py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">{staffMode ? "Register a Student" : "Apply Now"}</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              {staffMode ? "Complete the student's full application below." : "Take the first step towards your future. Complete the application form below."}
            </p>
          </div>
        </section>

        <section className="py-12 md:py-20 bg-background">
          <div className="container mx-auto px-4 min-w-0">
            <Card className="max-w-4xl mx-auto min-w-0">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl">Student Registration Form</CardTitle>
                <CardDescription>Fields marked with * are mandatory.{staffMode && ` The current Grade 12 minimum is ${cutoffs.male} for male and ${cutoffs.female} for female. You are registering a student — they log in with the email and password below.`}</CardDescription>
                {staffMode && newCode && <p className="text-sm mt-2">Last registered student code: <b className="text-primary">{newCode}</b></p>}
              </CardHeader>
              <CardContent>
                {staffMode && (
                  <div className="mb-8 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
                    <Label htmlFor="formPhoto" className="font-semibold">Fill from a photo of the paper form</Label>
                    <Input id="formPhoto" type="file" accept="image/*" disabled={reading} className="mt-2"
                      onChange={(e) => { autofill(e.target.files?.[0] ?? null); e.target.value = ""; }} />
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
                      {staffMode && field("password", "Student Password (min 8)", { type: "password", minLength: 8, autoComplete: "new-password" })}
                      {field("phone", "Phone Number", { type: "tel", placeholder: "+2519..." })}
                      {field("dob", "Date of Birth", { type: "date" })}
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
                      {fileInput("photo", "Personal Photo", "image/*", setPhoto, "Clear passport-style photo, under 5MB.")}
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
                      {field("houseNumber", "House Number", { maxLength: 30 })}
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
                      {fileInput("resultDoc", "Grade 12 Result Document (image)", "image/*", setResultDoc, "The result on this document must match the result you entered.")}
                      {fileInput("grade8", "Grade 8 Result", "image/*,application/pdf", setGrade8, "Image or PDF, under 5MB.")}
                      {fileInput("transcript", "Transcript (Grade 9–12)", "image/*,application/pdf", setTranscript, "Image or PDF, under 5MB.")}
                      {fileInput("manualForm", "Filled Manual Form", "image/*,application/pdf", setManualForm, "Scan or photo of the completed paper form — image or PDF, under 5MB.")}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Department Preferences</h3>
                    <div className="space-y-4">
                      <div className="max-w-sm">{pick("program", "Program", ["Regular", "Extension", "Weekend"], "Select program")}</div>
                      {deptSelect(1, "First Choice")}
                      {deptSelect(2, "Second Choice")}
                      {deptSelect(3, "Third Choice")}
                    </div>
                  </div>

                  <div className="max-w-sm">{opt("receiptNo", "Receipt No")}</div>
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Verifying & submitting..." : "Submit Application"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Application;
