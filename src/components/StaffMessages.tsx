import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, Pencil, Trash2, Send, ArrowLeft, RefreshCw, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { canChangeStaffMessage, validStaffMessage, STAFF_MESSAGE_LIMIT } from "@/lib/staffMessageRules";

type Contact = { user_id: string; full_name: string; role: string; department: string | null };
type Message = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string; edited_at: string | null };

export default function StaffMessages() {
  const location = useLocation();
  const [userId, setUserId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [older, setOlder] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const active = ["/admin-dashboard", "/staff", "/department-head"].includes(location.pathname);

  useEffect(() => {
    let alive = true;
    const loadContacts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      setUserId(user?.id ?? ""); setOpen(false); setSelected(null); setMessages([]);
      if (!user) { setContacts([]); return; }
      const { data, error } = await supabase.rpc("staff_message_contacts");
      if (alive) { setContacts(error ? [] : data ?? []); if (error) toast.error("Staff contacts could not be loaded"); }
    };
    if (active) void loadContacts();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { setContacts([]); setOpen(false); setUserId(""); }
      if (event === "SIGNED_IN") setTimeout(() => { if (alive && active) void loadContacts(); }, 0);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [active]);

  useEffect(() => {
    if (!open || !selected || !userId) return;
    let alive = true;
    const refresh = async () => {
      const { data, error } = await supabase.from("staff_messages").select("*")
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${selected.user_id}),and(sender_id.eq.${selected.user_id},recipient_id.eq.${userId})`)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(100);
      if (!alive) return;
      setLoading(false); setError(error ? "Messages could not be loaded. Try refreshing." : "");
      if (!error) {
        const rows = (data ?? []).reverse();
        setMessages(previous => {
          const merged = new Map(previous.filter(m => rows[0] && m.created_at < rows[0].created_at).map(m => [m.id, m]));
          rows.forEach(m => merged.set(m.id, m));
          return [...merged.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
        });
        setOlder((data?.length ?? 0) === 100);
      }
    };
    setLoading(true); void refresh();
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 10000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [open, selected, userId]);

  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);

  const loadOlder = async () => {
    if (!selected || !messages[0]) return;
    const { data, error } = await supabase.from("staff_messages").select("*")
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${selected.user_id}),and(sender_id.eq.${selected.user_id},recipient_id.eq.${userId})`)
      .lt("created_at", messages[0].created_at).order("created_at", { ascending: false }).limit(100);
    if (error) { toast.error("Earlier messages could not be loaded"); return; }
    setMessages(prev => [...(data ?? []).reverse(), ...prev]); setOlder(data?.length === 100);
  };
  const send = async () => {
    if (!selected || busy || !validStaffMessage(draft)) return;
    setBusy(true);
    const { data, error } = await supabase.from("staff_messages").insert({ sender_id: userId, recipient_id: selected.user_id, body: draft.trim() }).select().single();
    setBusy(false);
    if (error) { toast.error("Message could not be sent"); return; }
    setDraft(""); if (data) setMessages(prev => [...prev.filter(m => m.id !== data.id), data]);
  };
  const saveEdit = async (message: Message) => {
    if (busy || !canChangeStaffMessage(userId, message.sender_id) || !validStaffMessage(editText)) return;
    setBusy(true);
    const { data, error } = await supabase.from("staff_messages").update({ body: editText.trim() }).eq("id", message.id).eq("sender_id", userId).select().single();
    setBusy(false);
    if (error) { toast.error("Message could not be edited"); return; }
    setMessages(prev => prev.map(m => m.id === message.id ? data : m)); setEditing(null);
  };
  const remove = async (message: Message) => {
    if (busy || !canChangeStaffMessage(userId, message.sender_id) || !window.confirm("Delete this message for both participants?")) return;
    setBusy(true);
    const { data, error } = await supabase.from("staff_messages").delete().eq("id", message.id).eq("sender_id", userId).select("id");
    setBusy(false);
    if (error || !data?.length) { toast.error("Message could not be deleted"); return; }
    setMessages(prev => prev.filter(m => m.id !== message.id));
  };
  if (!active || !userId || !contacts.length) return null;
  return <>
    <Button variant="secondary" className="fixed bottom-5 left-5 z-40 gap-2 shadow-lg print:hidden" onClick={() => setOpen(true)}><MessageSquare className="h-4 w-4" />Staff messages</Button>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col p-4 sm:max-w-lg">
        <SheetTitle>Staff messages</SheetTitle>
        <SheetDescription className="sr-only">Private staff conversation</SheetDescription>
        {selected ? <>
          <div className="flex items-center gap-2 border-b pb-3">
            <Button variant="ghost" size="icon" aria-label="Back to staff contacts" onClick={() => { setSelected(null); setMessages([]); setDraft(""); setEditing(null); }}><ArrowLeft className="h-4 w-4" /></Button>
            <div className="min-w-0 flex-1"><p className="break-words font-medium">{selected.full_name}</p><p className="text-sm text-muted-foreground">{selected.department ?? selected.role.replace("_", " ")}</p></div>
            <Button variant="ghost" size="icon" aria-label="Refresh messages" onClick={() => setSelected({ ...selected })}><RefreshCw className="h-4 w-4" /></Button>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto" aria-label="Conversation">
            {loading && <p className="text-sm text-muted-foreground">Loading messages…</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {older && <Button variant="ghost" onClick={loadOlder}>Earlier messages</Button>}
            {!loading && !error && !messages.length && <p className="text-sm text-muted-foreground">No messages yet.</p>}
            {messages.map(message => <div key={message.id} className={`max-w-[90%] rounded-lg p-3 ${message.sender_id === userId ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {editing === message.id ? <><Textarea aria-label="Edit message text" value={editText} onChange={e => setEditText(e.target.value)} maxLength={STAFF_MESSAGE_LIMIT} className="bg-background text-foreground" /><div className="mt-2 flex gap-2"><Button size="icon" variant="secondary" aria-label="Save edited message" disabled={busy || !validStaffMessage(editText)} onClick={() => saveEdit(message)}><Check className="h-4 w-4" /></Button><Button size="icon" variant="secondary" aria-label="Cancel editing" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button></div></> : <p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{message.body}</p>}
              <div className="mt-2 flex items-center gap-1"><time className="flex-1 text-xs opacity-80" dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}{message.edited_at ? " · Edited" : ""}</time>
                {canChangeStaffMessage(userId, message.sender_id) && <><Button variant="ghost" size="icon" className="h-7 w-7" title="Edit message" aria-label="Edit message" disabled={busy} onClick={() => { setEditing(message.id); setEditText(message.body); }}><Pencil className="h-3 w-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" title="Delete message" aria-label="Delete message" disabled={busy} onClick={() => remove(message)}><Trash2 className="h-3 w-3" /></Button></>}
              </div>
            </div>)}<div ref={end} />
          </div>
          <form className="flex items-end gap-2 border-t pt-3" onSubmit={e => { e.preventDefault(); void send(); }}>
            <Textarea aria-label="Message text" placeholder="Message…" value={draft} onChange={e => setDraft(e.target.value)} maxLength={STAFF_MESSAGE_LIMIT} rows={3} className="resize-none" />
            <Button type="submit" size="icon" aria-label="Send staff message" disabled={busy || !validStaffMessage(draft)}><Send className="h-4 w-4" /></Button>
          </form>
        </> : <><Input aria-label="Search staff contacts" placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)} /><div className="min-h-0 flex-1 overflow-y-auto">{contacts.filter(c => `${c.full_name} ${c.department ?? ""} ${c.role}`.toLowerCase().includes(search.toLowerCase())).map(contact => <Button key={`${contact.user_id}-${contact.role}`} variant="ghost" className="h-auto w-full justify-start whitespace-normal border-b py-4 text-left" onClick={() => { setSelected(contact); setMessages([]); setDraft(""); setEditing(null); }}><div><p>{contact.full_name}</p><p className="text-xs text-muted-foreground">{contact.department ?? contact.role.replace("_", " ")}</p></div></Button>)}</div></>}
      </SheetContent>
    </Sheet>
  </>;
}