import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Visit = { path: string; visitor_id: string; device: string; created_at: string };

const VisitorsTab = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const load = async () => {
      const all: Visit[] = [];
      for (let from = 0; ; from += 1000) {
        const { data } = await supabase.from("site_visits").select("path,visitor_id,device,created_at")
          .gte("created_at", since).order("created_at", { ascending: false }).range(from, from + 999);
        all.push(...((data as Visit[]) || []));
        if (!data || data.length < 1000) break;
      }
      setVisits(all);
      setLoading(false);
    };
    load();
  }, []);

  const s = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const week = Date.now() - 7 * 86400000;
    const t = (v: Visit) => new Date(v.created_at).getTime();
    const count = (arr: string[]) => Object.entries(arr.reduce<Record<string, number>>((a, k) => ((a[k] = (a[k] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
    const days: [string, number][] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today - i * 86400000);
      const key = d.toDateString();
      days.push([d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), visits.filter((v) => new Date(v.created_at).toDateString() === key).length]);
    }
    return {
      total: visits.length,
      today: visits.filter((v) => t(v) >= today).length,
      week: visits.filter((v) => t(v) >= week).length,
      unique: new Set(visits.map((v) => v.visitor_id)).size,
      devices: count(visits.map((v) => v.device)),
      pages: count(visits.map((v) => v.path)).slice(0, 10),
      days,
    };
  }, [visits]);

  if (loading) return <p className="text-muted-foreground">Loading visitors…</p>;
  const maxDay = Math.max(1, ...s.days.map((d) => d[1]));

  return (
    <div className="space-y-6 min-w-0">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[["Visits today", s.today], ["Last 7 days", s.week], ["Last 30 days", s.total], ["Unique visitors (30d)", s.unique]].map(([l, v]) => (
          <Card key={l as string}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{l}</p><p className="text-3xl font-bold text-primary">{v}</p></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Daily visits (14 days)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {s.days.map(([d, n]) => (
              <div key={d} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                <span className="text-[10px] text-muted-foreground">{n}</span>
                <div className="w-full bg-primary rounded-t" style={{ height: `${(n / maxDay) * 100}%` }} />
                <span className="text-[9px] text-muted-foreground truncate w-full text-center">{d}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Devices</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {s.devices.map(([d, n]) => (
              <div key={d} className="flex justify-between capitalize"><span>{d}</span><span className="font-semibold">{n} ({Math.round((n / Math.max(1, s.total)) * 100)}%)</span></div>
            ))}
            {!s.devices.length && <p className="text-muted-foreground">No visits yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Popular pages</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {s.pages.map(([p, n]) => (
              <div key={p} className="flex justify-between gap-2"><span className="truncate" data-no-translate>{p}</span><span className="font-semibold">{n}</span></div>
            ))}
            {!s.pages.length && <p className="text-muted-foreground">No visits yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitorsTab;
