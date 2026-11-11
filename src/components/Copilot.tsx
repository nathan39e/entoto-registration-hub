import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Send, X, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Msg = { role: "user" | "assistant"; content: string };
const KEY = "tmpc-copilot";
const HELLO: Msg = { role: "assistant", content: "Hi! I'm the college assistant. Ask me about applying, documents, exams, payment or departments." };

export default function Copilot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(KEY) || "") as Msg[]; } catch { return [HELLO]; }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => { sessionStorage.setItem(KEY, JSON.stringify(msgs)); end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { if (open && !busy) ta.current?.focus(); }, [open, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next); setInput(""); setBusy(true);
    const { data, error } = await supabase.functions.invoke("copilot", {
      body: { messages: next.filter((m) => m !== HELLO).slice(-20), page: loc.pathname },
    });
    setMsgs([...next, { role: "assistant", content: error || !data?.reply ? (data?.error || "Sorry, I couldn't answer right now. Please try again.") : data.reply }]);
    setBusy(false);
  };

  return (
    <>
      {!open && (
        <Button onClick={() => setOpen(true)} size="icon" aria-label="Open college assistant"
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-lg print:hidden">
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl print:hidden">
          <div className="flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
            <div className="flex-1 text-sm font-semibold">College Assistant</div>
            <button aria-label="Close" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-primary-foreground" : "max-w-[95%]"}>
                {m.role === "user" ? m.content : (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_a]:text-primary [&_a]:underline">
                    <ReactMarkdown components={{ a: ({ href, children }) => (
                      <a href={href} onClick={(e) => { if (href?.startsWith("/")) { e.preventDefault(); nav(href); } }}
                        target={href?.startsWith("/") ? undefined : "_blank"} rel="noreferrer">{children}</a>) }}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="text-muted-foreground animate-pulse">Typing…</div>}
            <div ref={end} />
          </div>
          <div className="flex items-end gap-2 border-t p-2">
            <Textarea ref={ta} rows={1} value={input} placeholder="Ask a question…" className="min-h-[40px] resize-none"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <Button size="icon" onClick={send} disabled={busy || !input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </>
  );
}
