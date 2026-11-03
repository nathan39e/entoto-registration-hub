import { Card, CardContent } from "@/components/ui/card";

/** Shows how many applicants are male, female, or unspecified. */
export default function GenderStats({ genders, className = "" }: { genders: (string | null | undefined)[]; className?: string }) {
  const norm = genders.map((g) => (g ?? "").toLowerCase());
  const male = norm.filter((g) => g === "male").length;
  const female = norm.filter((g) => g === "female").length;
  const other = genders.length - male - female;
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
            <p className="text-xs text-muted-foreground">{i.label} · {genders.length ? Math.round((i.n / genders.length) * 100) : 0}%</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
