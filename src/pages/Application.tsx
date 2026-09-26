import { useEffect, useState } from "react";
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

const DEPARTMENTS = [
  "ICT", "Hotel and Tourism", "Garment and Textile", "Automotive Technology", "Business and Finance",
  "Aesthetics", "Electrical and Electronics", "Urban Agriculture", "Construction Technology", "Wood Work and Metal Technology",
];
const SUBCITIES = ["Addis Ketema", "Akaky Kaliti", "Arada", "Bole", "Gullele", "Kirkos", "Kolfe Keranio", "Lideta", "Nifas Silk-Lafto", "Yeka", "Lemi Kura"];

const text = (max = 100) => z.string().trim().min(1, "Required").max(max);
const schema = z.object({
  firstName: text(), middleName: text(), lastName: text(),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Invalid phone number"),
  dob: text(20), gender: z.enum(["male", "female"]),
  country: text(), city: text(),
  subcity: text(), wereda: text(), kebele: text(10), houseNumber: text(30),
  specificPlace: z.string().trim().max(300).optional(),
  emergencyName: text(), emergencyRelation: text(50),
  emergencyPhone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Invalid emergency phone number"),
  grade12: z.coerce.number().min(0).max(700),
  choice1: text(), choice2: text(), choice3: text(),
});

const toDataUrl = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
});

const Application = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [v, setV] = useState<Record<string, string>>({ country: "Ethiopia", city: "Addis Ababa" });
  const [resultDoc, setResultDoc] = useState<File | null>(null);
  const set = (k: string) => (val: string) => setV((p) => ({ ...p, [k]: val }));

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/auth");
      else setV((p) => ({ ...p, email: p.email ?? user.email ?? "" }));
    });
  }, [navigate]);

  const inAddis = v.country === "Ethiopia" && v.city?.trim().toLowerCase() === "addis ababa";

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
    if (!resultDoc) return toast.error("Please upload your Grade 12 result document.");
    if (!resultDoc.type.startsWith("image/") || resultDoc.size > 5 * 1024 * 1024)
      return toast.error("Result document must be an image (JPG/PNG) under 5MB.");

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

      const { choice1: c1, choice2: c2, choice3: c3, grade12, ...personal } = parsed.data;
      const { error } = await supabase.from("applications").insert({
        user_id: user.id,
        grade_12_results: { score: grade12, verified: true, verified_score: ver.extracted, personal_info: personal },
        first_choice: c1, second_choice: c2, third_choice: c3,
      });
      if (error) throw error;
      toast.success("Application submitted! Proceeding to psychometric exam.");
      setTimeout(() => navigate("/psychometric-exam"), 1200);
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
  const deptSelect = (id: string, label: string) => (
    <div>
      <Label>{label} *</Label>
      <Select value={v[id]} onValueChange={set(id)}>
        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
        <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">Apply Now</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Take the first step towards your future. Complete the application form below.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl">Student Registration Form</CardTitle>
                <CardDescription>Fields marked with * are mandatory.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {field("firstName", "First Name", { maxLength: 100 })}
                      {field("middleName", "Middle Name", { maxLength: 100 })}
                      {field("lastName", "Last Name", { maxLength: 100 })}
                      {field("email", "Email Address", { type: "email", maxLength: 255 })}
                      {field("phone", "Phone Number", { type: "tel", placeholder: "+2519..." })}
                      {field("dob", "Date of Birth", { type: "date" })}
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
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {field("country", "Country", { maxLength: 100 })}
                      {field("city", "City", { maxLength: 100 })}
                      {inAddis ? (
                        <div>
                          <Label>Sub City *</Label>
                          <Select value={v.subcity} onValueChange={set("subcity")}>
                            <SelectTrigger><SelectValue placeholder="Select sub city" /></SelectTrigger>
                            <SelectContent>{SUBCITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ) : field("subcity", "Sub City / Zone", { maxLength: 100 })}
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
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {field("grade12", "Grade 12 Exit Exam Result", { type: "number", min: 0, max: 700, placeholder: "e.g., 450" })}
                      <div>
                        <Label htmlFor="resultDoc">Grade 12 Result Document (image) *</Label>
                        <Input id="resultDoc" type="file" accept="image/*" required
                          onChange={(e) => setResultDoc(e.target.files?.[0] ?? null)} />
                        <p className="text-xs text-muted-foreground mt-1">
                          The result on this document must match the result you entered.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Department Preferences</h3>
                    <div className="space-y-4">
                      {deptSelect("choice1", "First Choice")}
                      {deptSelect("choice2", "Second Choice")}
                      {deptSelect("choice3", "Third Choice")}
                    </div>
                  </div>

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
