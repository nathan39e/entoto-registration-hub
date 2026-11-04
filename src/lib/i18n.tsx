import { createContext, useContext, useEffect, type ReactNode } from "react";

// Site is English-only; the AI Amharic translation was removed to save credits.
export type Lang = "en";
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });
export const useLang = () => useContext(LangContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = "en";
    try { localStorage.removeItem("tmpc-lang"); localStorage.removeItem("tmpc-am-cache-v1"); } catch { /* ignore */ }
  }, []);
  return <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>{children}</LangContext.Provider>;
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
