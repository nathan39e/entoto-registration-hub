import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { daysInEthiopianMonth, ETHIOPIAN_MONTHS, ethiopianToISO, isoToEthiopian } from "@/lib/ethiopianCalendar";

export default function EthiopianDatePicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [parts, setParts] = useState<[string, string, string]>(["", "", ""]);
  useEffect(() => { const d = isoToEthiopian(value); if (d) setParts(d.map(String) as [string, string, string]); }, [value]);
  const change = (index: number, next: string) => {
    const p: [string, string, string] = [...parts]; p[index] = next;
    if (p[0] && p[1] && Number(p[2]) > daysInEthiopianMonth(Number(p[0]), Number(p[1]))) p[2] = "";
    setParts(p);
    if (p.every(Boolean) && Number(p[0]) >= 1800) {
      try { const iso = ethiopianToISO(...p.map(Number) as [number, number, number]); onChange(iso <= new Date().toISOString().slice(0, 10) ? iso : ""); } catch { onChange(""); }
    } else onChange("");
  };
  const days = parts[0] && parts[1] ? daysInEthiopianMonth(Number(parts[0]), Number(parts[1])) : 30;
  return <div className="space-y-2" data-no-translate>
    <Label>Date of Birth (Ethiopian calendar) *</Label>
    <div className="grid grid-cols-[1fr_1.6fr_1fr] gap-2">
      <Input aria-label="Birth year E.C." placeholder="Year E.C." type="number" min={1800} max={isoToEthiopian(new Date().toISOString().slice(0, 10))?.[0]} value={parts[0]} onChange={(e) => change(0, e.target.value)} />
      <Select value={parts[1]} onValueChange={(v) => change(1, v)}><SelectTrigger aria-label="Birth month E.C."><SelectValue placeholder="Month" /></SelectTrigger><SelectContent>{ETHIOPIAN_MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent></Select>
      <Select value={parts[2]} onValueChange={(v) => change(2, v)}><SelectTrigger aria-label="Birth day E.C."><SelectValue placeholder="Day" /></SelectTrigger><SelectContent>{Array.from({ length: days }, (_, i) => <SelectItem key={i} value={String(i + 1)}>{i + 1}</SelectItem>)}</SelectContent></Select>
    </div>
  </div>;
}