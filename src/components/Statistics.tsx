import { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen, Award } from "lucide-react";
import { useInView } from "@/components/Reveal";

const CountUp = ({ end, suffix = "", start }: { end: number; suffix?: string; start: boolean }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(end); return; }
    let raf = 0; const t0 = performance.now(); const dur = 1800;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, end]);
  return <>{n.toLocaleString()}{suffix}</>;
};

const stats = [
  { icon: Users, end: 5000, suffix: "+", label: "Active Students" },
  { icon: GraduationCap, end: 10, suffix: "", label: "Departments" },
  { icon: BookOpen, end: 50, suffix: "+", label: "Programs" },
  { icon: Award, end: 95, suffix: "%", label: "Employment Rate" },
];

const Statistics = () => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section className="py-16 bg-gradient-primary">
      <div ref={ref} className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`text-center text-primary-foreground reveal ${inView ? "reveal-visible" : ""}`} style={{ transitionDelay: `${index * 120}ms` }}>
                <Icon className="h-12 w-12 mx-auto mb-4 opacity-90 animate-float" style={{ animationDelay: `${index * 400}ms` }} />
                <div className="text-4xl font-bold mb-2 tabular-nums" data-no-translate><CountUp end={stat.end} suffix={stat.suffix} start={inView} /></div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
