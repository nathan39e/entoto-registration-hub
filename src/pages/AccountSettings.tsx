import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { greeting, useLang } from "@/lib/i18n";

const ROLE_LABEL: Record<string, string> = { admin: "Admin", sub_admin: "Sub Admin", department_head: "Department Head", student: "Student" };

const AccountSettings = () => {
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const [userId, setUserId] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [dept, setDept] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [originalEmail, setOriginalEmail] = useState("");
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/auth");
      setUserId(user.id);
      const [{ data: p }, { data: r }, { data: h }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, email").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("department_heads").select("department").eq("user_id", user.id).maybeSingle(),
      ]);
      setForm({ full_name: p?.full_name ?? "", phone: p?.phone ?? "", email: user.email ?? p?.email ?? "" });
      setOriginalEmail(user.email ?? "");
      setRoles((r ?? []).map((x) => x.role));
      setDept(h?.department ?? null);
      setLoading(false);
    })();
  }, [navigate]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.full_name.trim();
    if (name.length < 2 || name.length > 100) return toast.error("Please enter a valid full name");
    if (form.phone && !/^\+?[0-9 ]{9,15}$/.test(form.phone.trim())) return toast.error("Please enter a valid phone number");
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name, phone: form.phone.trim() || null }).eq("id", userId);
    if (error) { setSaving(false); return toast.error(error.message); }
    if (form.email.trim() && form.email.trim() !== originalEmail) {
      const { error: e2 } = await supabase.auth.updateUser({ email: form.email.trim() });
      if (e2) { setSaving(false); return toast.error(e2.message); }
      toast.info("Check your new email inbox to confirm the change");
    }
    await supabase.auth.updateUser({ data: { full_name: name } });
    setSaving(false);
    toast.success("Profile updated");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw.next !== pw.confirm) return toast.error("Passwords do not match");
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) return toast.error(error.message);
    setPw({ next: "", confirm: "" });
    toast.success("Password changed");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{greeting()}, {form.full_name.split(" ")[0] || "there"}</h1>
          <p className="text-muted-foreground">Profile & Settings</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {roles.map((r) => <Badge key={r} variant="secondary">{ROLE_LABEL[r] ?? r}</Badge>)}
            {dept && <Badge variant="outline">{dept}</Badge>}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle><CardDescription>Update your name, phone number and email.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="fn">Full name</Label><Input id="fn" maxLength={100} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="ph">Phone</Label><Input id="ph" maxLength={15} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251..." /></div>
              <div className="space-y-2"><Label htmlFor="em">Email</Label><Input id="em" type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="np">New password</Label><Input id="np" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="cp">Confirm password</Label><Input id="cp" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
              <Button type="submit" variant="outline">Update password</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Language</CardTitle><CardDescription>Choose the language for the whole website.</CardDescription></CardHeader>
          <CardContent className="flex gap-2" data-no-translate>
            <Button variant={lang === "en" ? "default" : "outline"} onClick={() => setLang("en")}>English</Button>
            <Button variant={lang === "am" ? "default" : "outline"} onClick={() => setLang("am")}>አማርኛ</Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AccountSettings;
