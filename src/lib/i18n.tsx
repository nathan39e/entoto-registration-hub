import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Lang = "en" | "am";
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });
export const useLang = () => useContext(LangContext);

const CACHE_KEY = "tmpc-am-cache-v1";
const cache: Record<string, string> = (() => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; } })();
const saveCache = () => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* full */ } };

// Original English text for each translated node / attribute
const originals = new WeakMap<Node, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();
const ATTRS = ["placeholder", "title", "aria-label", "alt"];
const shouldTranslate = (s: string) => /[A-Za-z]{2,}/.test(s) && !/^\S+@\S+$/.test(s) && !/^https?:/.test(s) && !/^EPC[0-9A-F]{8}$/.test(s);

const pending = new Set<string>();
let timer: number | undefined;
const listeners = new Set<() => void>();

async function flush() {
  const batch = [...pending].slice(0, 100);
  batch.forEach((b) => pending.delete(b));
  if (!batch.length) return;
  const { data } = await supabase.functions.invoke("translate", { body: { texts: batch } });
  const out: string[] = data?.translations ?? [];
  batch.forEach((t, i) => { cache[t] = out[i] ?? t; });
  saveCache();
  listeners.forEach((l) => l());
  if (pending.size) timer = window.setTimeout(flush, 50);
}
const request = (t: string) => { if (cache[t] || pending.has(t)) return; pending.add(t); clearTimeout(timer); timer = window.setTimeout(flush, 250); };

function skip(el: Element | null) {
  return !el || !!el.closest("script,style,code,textarea,[data-no-translate],[contenteditable=true]");
}

function translateTree(root: Node, lang: Lang) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const node = n as Text;
    if (skip(node.parentElement)) continue;
    const current = node.nodeValue ?? "";
    let orig = originals.get(node);
    // React changed the text since we translated it
    if (orig === undefined || (current !== orig && current !== cache[orig.trim()] && !current.includes(cache[orig.trim()] ?? "\u0000"))) { orig = current; originals.set(node, orig); }
    const key = orig.trim();
    if (lang === "en") { if (current !== orig) node.nodeValue = orig; continue; }
    if (!shouldTranslate(key)) continue;
    if (cache[key]) { const next = orig.replace(key, cache[key]); if (current !== next) node.nodeValue = next; }
    else request(key);
  }
  const els = root instanceof Element ? [root, ...root.querySelectorAll("*")] : root instanceof Document ? [...root.querySelectorAll("*")] : [];
  for (const el of els) {
    if (skip(el)) continue;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const store = attrOriginals.get(el) ?? {};
      if (store[a] === undefined || (v !== store[a] && v !== cache[store[a]])) store[a] = v;
      attrOriginals.set(el, store);
      const orig = store[a];
      if (lang === "en") { if (v !== orig) el.setAttribute(a, orig); continue; }
      if (!shouldTranslate(orig)) continue;
      if (cache[orig]) { if (v !== cache[orig]) el.setAttribute(a, cache[orig]); } else request(orig);
    }
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("tmpc-lang") as Lang) || "en");
  const setLang = useCallback((l: Lang) => { localStorage.setItem("tmpc-lang", l); setLangState(l); }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    let running = false;
    const run = () => { if (running) return; running = true; observer.disconnect(); translateTree(document.body, lang); observer.observe(document.body, opts); running = false; };
    const opts = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS };
    let raf = 0;
    const observer = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); });
    run();
    listeners.add(run);
    return () => { observer.disconnect(); listeners.delete(run); cancelAnimationFrame(raf); };
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
