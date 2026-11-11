import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll } from "@/lib/fetchAll";
import { privateDocUrl } from "@/lib/privateDoc";
import { cbeFor } from "@/lib/cbe";

type Payment = { id: string; user_id: string; amount: number; status: string | null; transaction_id: string | null; payment_method: string | null; receipt_path: string | null; created_at: string; program: string | null };
type Student = { id: string; full_name: string; student_code: string; phone: string | null; program: string; status: string | null; telegram: boolean; lastRequest?: string };

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [names, setNames] = useState<Record<string, { full_name: string; student_code: string }>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [pq, setPq] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [pays, profs, apps, roles, chats, reqs] = (await Promise.all([
      fetchAll(() => supabase.from("payments").select("id, user_id, amount, status, transaction_id, payment_method, receipt_path, created_at, program").order("created_at", { ascending: false })),
      fetchAll(() => supabase.from("profiles").select("id, full_name, student_code, phone").order("id")),
      fetchAll(() => supabase.from("applications").select("user_id, program, status").order("id")),
      fetchAll(() => supabase.from("user_roles").select("user_id").in("role", ["admin", "sub_admin", "department_head", "viewer", "finance"]).order("id")),
      fetchAll(() => supabase.from("telegram_student_chats").select("user_id").order("user_id")),
      fetchAll(() => supabase.from("payment_requests").select("user_id, created_at").order("created_at", { ascending: false })),
    ])).map((r) => { if (r.error) throw r.error; return r.data; });
    const p = pays as Payment[]; setPayments(p);
    const prof = profs as { id: string; full_name: string; student_code: string; phone: string | null }[];
    setNames(Object.fromEntries(prof.map((x) => [x.id, x])));
    const staff = new Set((roles as { user_id: string }[]).map((r) => r.user_id));
    const linked = new Set((chats as { user_id: string }[]).map((c) => c.user_id));
    const paid = new Set(p.filter((x) => x.status === "completed").map((x) => x.user_id));
    const last: Record<string, string> = {}; for (const r of reqs as { user_id: string; created_at: string }[]) last[r.user_id] ??= r.created_at;
    const byId = Object.fromEntries(prof.map((x) => [x.id, x]));
    setStudents((apps as { user_id: string; program: string | null; status: string | null }[])
      .filter((a) => !staff.has(a.user_id) && !paid.has(a.user_id) && byId[a.user_id] && !["waiting_list", "rejected"].includes(a.status ?? ""))
      .map((a) => ({ ...byId[a.user_id], program: a.program ?? "Regular", status: a.status, telegram: linked.has(a.user_id), lastRequest: last[a.user_id] })));
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return navigate("/auth");
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["finance", "admin"]);
      if (!data?.length) return navigate("/");
      setOk(true); load().catch(() => toast.error("Could not load finance data"));
    });
  }, [navigate]);

  const stats = useMemo(() => {
    const done = payments.filter((p) => p.status === "completed");
    return { collected: done.reduce((s, p) => s + Number(p.amount), 0), verified: done.length, pending: payments.filter((p) => p.status === "pending" && p.payment_method !== "chapa").length,
      regular: done.filter((p) => cbeFor(p.program).amount === 350).length, other: done.filter((p) => cbeFor(p.program).amount === 1700).length };
  }, [payments]);

  const review = async (id: string, status: "completed" | "rejected") => {
    const { error } = await supabase.from("payments").update({ status, paid_at: status === "completed" ? new Date().toISOString() : null }).eq("id", id);
    if (!error) supabase.functions.invoke("finance-request", { body: { action: "notify", payment_id: id } }).catch(() => {});
    if (error) return toast.error("Could not update payment");
    toast.success(status === "completed" ? "Payment verified" : "Payment rejected"); load();
  };
  const openReceipt = async (path: string) => { try { window.open(await privateDocUrl(path), "_blank"); } catch { toast.error("Could not open receipt"); } };

  const send = async (ids: string[]) => {
    if (!ids.length) return toast.error("Select students first");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("finance-request", { body: { user_ids: ids } });
    setBusy(false);
    if (error || data?.error) return toast.error(data?.error ?? "Could not send requests");
    toast.success(`Sent on Telegram: ${data.sent}. Not on Telegram yet: ${data.unreachable}.${data.skipped ? ` Already paid: ${data.skipped}.` : ""}`);
    setSelected([]); load();
  };

  const term = q.trim().toLowerCase();
  const shown = students.filter((s) => !term || [s.full_name, s.student_code, s.phone ?? ""].some((x) => x.toLowerCase().includes(term)));
  const pterm = pq.trim().toLowerCase();
  const paidList = payments.filter((p) => p.status === "completed").filter((p) => !pterm || [names[p.user_id]?.full_name ?? "", names[p.user_id]?.student_code ?? "", (names[p.user_id] as any)?.phone ?? "", p.transaction_id ?? ""].some((x) => x.toLowerCase().includes(pterm)));
  const queue = payments.filter((p) => p.status === "pending" && p.payment_method !== "chapa");
  if (!ok) return null;

  return <div className="min-h-screen flex flex-col"><Header />
    <main className="flex-grow container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-2xl md:text-3xl font-bold">Finance Dashboard</h1><Button variant="outline" onClick={() => load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[["Total collected", `${stats.collected.toLocaleString()} ETB`], ["Verified payments", stats.verified], ["Receipts to review", stats.pending], ["Regular paid (350)", stats.regular], ["Weekend/Extension paid (1,700)", stats.other]].map(([l, v]) =>
          <Card key={l as string}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{l}</p><p className="text-2xl font-bold">{v}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="pt-6 text-sm grid gap-1 sm:grid-cols-2">
        <p>CBE account — Regular: <span className="font-mono font-semibold">{cbeFor("Regular").account}</span></p>
        <p>CBE account — Weekend &amp; Extension: <span className="font-mono font-semibold">{cbeFor("Weekend").account}</span></p>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Receipts to review ({queue.length})</CardTitle></CardHeader><CardContent className="divide-y">
        {queue.map((p) => <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
          <div><p className="font-medium">{names[p.user_id]?.full_name ?? "Student"} <span className="text-muted-foreground text-sm">{names[p.user_id]?.student_code}</span></p>
            <p className="text-sm text-muted-foreground">{p.amount} ETB · {p.program ?? "Regular"} · Ref: {p.transaction_id ?? "—"} · {new Date(p.created_at).toLocaleDateString()}</p></div>
          <div className="flex gap-2">{p.receipt_path && <Button size="sm" variant="outline" onClick={() => openReceipt(p.receipt_path!)}>View receipt</Button>}
            <Button size="sm" onClick={() => review(p.id, "completed")}>Verify</Button><Button size="sm" variant="destructive" onClick={() => review(p.id, "rejected")}>Reject</Button></div>
        </div>)}
        {!queue.length && <p className="py-3 text-sm text-muted-foreground">No receipts waiting.</p>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Paid students ({payments.filter((p) => p.status === "completed").length})</CardTitle></CardHeader><CardContent className="space-y-3">
        <Input placeholder="Search name, Student ID, phone or reference" value={pq} onChange={(e) => setPq(e.target.value)} className="max-w-sm" />
        <div className="divide-y">{paidList.slice(0, 300).map((p) => <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
          <div><p className="font-medium">{names[p.user_id]?.full_name ?? "Student"} <span className="text-muted-foreground text-sm">{names[p.user_id]?.student_code}</span></p>
            <p className="text-sm text-muted-foreground">{p.amount} ETB · {p.program ?? "Regular"} · {p.payment_method === "chapa" ? "Chapa" : "CBE"} · Ref: {p.transaction_id ?? "—"} · {new Date(p.created_at).toLocaleDateString()}</p></div>
          <div className="flex items-center gap-2"><Badge>Verified</Badge>{p.receipt_path && <Button size="sm" variant="outline" onClick={() => openReceipt(p.receipt_path!)}>View receipt</Button>}</div>
        </div>)}
        {!paidList.length && <p className="py-3 text-sm text-muted-foreground">No paid students found.</p>}
        {paidList.length > 300 && <p className="text-xs text-muted-foreground py-2">Showing first 300 — search to narrow.</p>}</div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Unpaid students ({students.length})</CardTitle></CardHeader><CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Payment requests are sent through the college Telegram bot. A student can receive them only after sharing their own phone number with the bot once.</p>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search name, Student ID or phone" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
          <Button disabled={busy || !selected.length} onClick={() => send(selected)}><Send className="mr-2 h-4 w-4" />Send request to selected ({selected.length})</Button>
          <Button variant="outline" onClick={() => setSelected(shown.filter((s) => s.telegram).map((s) => s.id))}>Select all on Telegram</Button>
        </div>
        <div className="divide-y">{shown.slice(0, 300).map((s) => <label key={s.id} className="py-2 flex flex-wrap items-center gap-3 cursor-pointer">
          <Checkbox checked={selected.includes(s.id)} onCheckedChange={(c) => setSelected((x) => c ? [...x, s.id] : x.filter((y) => y !== s.id))} />
          <div className="flex-1 min-w-[12rem]"><p className="font-medium">{s.full_name} <span className="text-sm text-muted-foreground">{s.student_code}</span></p>
            <p className="text-xs text-muted-foreground">{s.program} · {cbeFor(s.program).amount} ETB{s.lastRequest ? ` · last request ${new Date(s.lastRequest).toLocaleDateString()}` : ""}</p></div>
          <Badge variant={s.telegram ? "default" : "secondary"}>{s.telegram ? "On Telegram" : "Not on Telegram"}</Badge>
        </label>)}
        {shown.length > 300 && <p className="text-xs text-muted-foreground py-2">Showing first 300 — search to narrow.</p>}</div>
      </CardContent></Card>
    </main><Footer /></div>;
}
