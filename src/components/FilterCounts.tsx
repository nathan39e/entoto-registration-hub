import { Badge } from "@/components/ui/badge";

/** Shows the total of the filtered list plus a per-program and per-occupation breakdown. */
const FilterCounts = ({ items }: { items: { program?: string | null; occupation?: string | null }[] }) => {
  const tally = (key: "program" | "occupation") => {
    const m = new Map<string, number>();
    for (const i of items) { const k = i[key] || "Not set"; m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  return (
    <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
      <p className="font-semibold">Filtered students: <span className="text-primary">{items.length}</span></p>
      <div className="flex flex-wrap gap-1"><span className="text-muted-foreground mr-1">By program:</span>{tally("program").map(([k, n]) => <Badge key={k} variant="secondary">{k}: {n}</Badge>)}</div>
      <div className="flex flex-wrap gap-1"><span className="text-muted-foreground mr-1">By occupation:</span>{tally("occupation").map(([k, n]) => <Badge key={k} variant="outline">{k}: {n}</Badge>)}</div>
    </div>
  );
};
export default FilterCounts;
