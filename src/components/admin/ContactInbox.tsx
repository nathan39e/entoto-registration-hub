import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll } from "@/lib/fetchAll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export default function ContactInbox() {
  const [rows, setRows] = useState<Tables<"contact_submissions">[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const { data, error } = await fetchAll(() => supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).order("id"));
    setLoading(false);
    if (error) return toast.error("Could not load messages.");
    setRows(data ?? []);
  };
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
    return () => window.clearInterval(timer);
  }, []);
  const current = rows.find(row => row.id === selected);
  const open = async (row: Tables<"contact_submissions">) => {
    setSelected(row.id); setReply(row.reply ?? "");
    const { error } = await supabase.rpc("mark_contact_read", { _id: row.id });
    if (error) toast.error("Could not mark message as read.");
    else void load();
  };
  const send = async () => {
    if (!current || !reply.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("reply_to_contact", { _id: current.id, _reply: reply.trim() });
    setBusy(false);
    if (error) return toast.error("Could not save reply.");
    toast.success("Reply sent to the visitor's private conversation.");
    await load();
  };
  const filtered = rows.filter(row => `${row.name} ${row.email} ${row.subject}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="space-y-4">
    <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">Contact inbox ({rows.filter(row => !row.read_at).length} unread)</h2><Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
    <Input aria-label="Search messages" placeholder="Search name, email or subject" value={query} onChange={e => setQuery(e.target.value)} />
    {loading ? <p>Loading messages...</p> : <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2 max-h-[650px] overflow-auto">{filtered.length === 0 && <p className="text-muted-foreground">No messages found.</p>}{filtered.map(row => <Button key={row.id} variant={selected === row.id ? "secondary" : "outline"} onClick={() => open(row)} className="h-auto w-full text-left justify-start whitespace-normal p-4"><span className="min-w-0 space-y-1"><span className="block font-semibold break-words">{row.subject}</span><span className="block break-words">{row.name} · {row.email}</span><span className="block text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span><Badge variant={row.reply ? "secondary" : "outline"}>{row.reply ? "Replied" : row.read_at ? "Read" : "New"}</Badge></span></Button>)}</div>
      {current && <div className="min-w-0 space-y-4"><h3 className="text-xl font-semibold break-words">{current.subject}</h3><p className="text-muted-foreground break-words">{current.name} · {current.email}</p><p className="whitespace-pre-wrap break-words">{current.message}</p><label className="block font-medium" htmlFor="contact-reply">Reply</label><Textarea id="contact-reply" rows={7} maxLength={5000} value={reply} onChange={e => setReply(e.target.value)} /><Button onClick={send} disabled={busy || !reply.trim()}><Send className="mr-2 h-4 w-4" />{busy ? "Sending..." : "Send Reply"}</Button>{current.replied_at && <p className="text-xs text-muted-foreground">Last reply: {new Date(current.replied_at).toLocaleString()}</p>}</div>}
    </div>}
  </section>;
}