import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const visitorId = () => {
  const key = "tmpc_visitor";
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const { id, at } = JSON.parse(raw);
      if (Date.now() - at < 86400000) return id as string;
    }
    const id = crypto.randomUUID();
    localStorage.setItem(key, JSON.stringify({ id, at: Date.now() }));
    return id;
  } catch {
    return "anon";
  }
};

const device = () => {
  const w = window.innerWidth;
  return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
};

const VisitTracker = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    supabase.from("site_visits").insert({ path: pathname.slice(0, 300), visitor_id: visitorId(), device: device() }).then(() => {});
  }, [pathname]);
  return null;
};

export default VisitTracker;
