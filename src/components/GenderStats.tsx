import { Card, CardContent } from "@/components/ui/card";

/** Shows how many applicants are male, female, or unspecified. */
export default function GenderStats({ genders = [], counts, className = "" }: { genders?: (string | null | undefined)[]; counts?: { male: number; female: number; other: number }; className?: string }) {
  const norm = genders.map((g) => (g ?? "").toLowerCase());
  const male = counts?.male ?? norm.filter((g) => g === "male").length;
  const female = counts?.female ?? norm.filter((g) => g === "female").length;
  const other = counts?.other ?? genders.length - male - female;
  const total = male + female + other;
  const items = [
    { label: "Male students", n: male },
    { label: "Female students", n: female },
    ...(other ? [{ label: "Gender not given", n: other }] : []),
  ];
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${className}`}>
      {items.map((i) => (
        <Card key={i.label}>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">{i.n}</p>
            <p className="text-xs text-muted-foreground">{i.label} · {total ? Math.round((i.n / total) * 100) : 0}%</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
